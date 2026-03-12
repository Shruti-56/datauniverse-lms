import { Request, Response } from 'express';
import { UserRole, LiveLectureBatchType } from '@prisma/client';
import { emailService } from '../services/email.service';
import { s3Service } from '../services/s3.service';
import { prisma } from '../lib/prisma';

/** Ensures meeting link is absolute (https://...) so redirect goes to Teams/Meet, not localhost/path. */
function toAbsoluteMeetingUrl(link: string | null | undefined): string | null {
  if (!link || typeof link !== 'string') return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

/** Create one LiveLecture per day for a module (for attendance & recording per day) */
async function createLecturesForModule(module: {
  id: string;
  batchId: string;
  instructorId: string;
  name: string;
  meetingLink: string | null;
  startDate: Date;
  endDate: Date;
  lectureTime: string;
}): Promise<void> {
  const parts = module.lectureTime.trim().split(':').map(Number);
  const hh = Number.isNaN(parts[0]) ? 10 : Math.max(0, Math.min(23, parts[0]));
  const mm = Number.isNaN(parts[1]) ? 0 : Math.max(0, Math.min(59, parts[1]));

  const start = new Date(module.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(module.endDate);
  end.setHours(23, 59, 59, 999);

  const toCreate: { batchId: string; instructorId: string; moduleId: string; title: string; meetingLink: string | null; scheduledAt: Date; durationMinutes: number }[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    const scheduledAt = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hh, mm, 0);
    const dateStr = cursor.toISOString().slice(0, 10);
    toCreate.push({
      batchId: module.batchId,
      instructorId: module.instructorId,
      moduleId: module.id,
      title: `${module.name} - ${dateStr}`,
      meetingLink: module.meetingLink,
      scheduledAt,
      durationMinutes: 60,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  if (toCreate.length > 0) {
    await prisma.liveLecture.createMany({ data: toCreate });
  }
}

export const liveLectureController = {
  // ========== BATCHES (Admin) ==========
  listBatches: async (req: Request, res: Response): Promise<void> => {
    try {
      const batches = await prisma.liveLectureBatch.findMany({
        include: {
          _count: { select: { students: true, lectures: true, modules: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json(batches);
    } catch (error: unknown) {
      console.error('List batches error:', error);
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  },

  createBatch: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, type } = req.body;
      if (!name?.trim()) {
        res.status(400).json({ error: 'Batch name is required' });
        return;
      }
      // Only regular batches: students attend live and get recordings; no FAST_FORWARD/PAP.
      const batch = await prisma.liveLectureBatch.create({
        data: { name: name.trim(), description: description?.trim() || null, type: LiveLectureBatchType.REGULAR },
      });
      res.status(201).json(batch);
    } catch (error: unknown) {
      console.error('Create batch error:', error);
      res.status(500).json({ error: 'Failed to create batch' });
    }
  },

  updateBatch: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const data: { name?: string; description?: string | null } = {};
      if (name !== undefined) data.name = name.trim();
      if (description !== undefined) data.description = description?.trim() || null;
      // Batch type is always REGULAR; we do not change it via API.
      const batch = await prisma.liveLectureBatch.update({
        where: { id },
        data,
      });
      res.json(batch);
    } catch (error: unknown) {
      console.error('Update batch error:', error);
      res.status(500).json({ error: 'Failed to update batch' });
    }
  },

  deleteBatch: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.liveLectureBatch.delete({ where: { id } });
      res.json({ message: 'Batch deleted' });
    } catch (error: unknown) {
      console.error('Delete batch error:', error);
      res.status(500).json({ error: 'Failed to delete batch' });
    }
  },

  // ========== MODULES (MySQL, Python, PySpark, AWS, PowerBI etc.) ==========
  listModules: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId } = req.params;
      const modules = await prisma.liveLectureModule.findMany({
        where: { batchId },
        include: {
          instructor: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
        // Newest first so newly added module appears at top
        orderBy: { createdAt: 'desc' },
      });
      res.json(modules);
    } catch (error: unknown) {
      console.error('List modules error:', error);
      res.status(500).json({ error: 'Failed to fetch modules' });
    }
  },

  createModule: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId } = req.params;
      const { name, instructorId, meetingLink, startDate, endDate, lectureTime } = req.body;
      if (!name?.trim() || !instructorId || !startDate || !endDate || !lectureTime) {
        res.status(400).json({ error: 'Name, instructor, start date, end date and lecture time are required' });
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const module = await prisma.liveLectureModule.create({
        data: {
          batchId,
          name: name.trim(),
          instructorId,
          meetingLink: meetingLink?.trim() || null,
          startDate: start,
          endDate: end,
          lectureTime: String(lectureTime).trim(), // "HH:mm"
        },
        include: {
          instructor: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        },
      });
      await createLecturesForModule({
        id: module.id,
        batchId: module.batchId,
        instructorId: module.instructorId,
        name: module.name,
        meetingLink: module.meetingLink,
        startDate: start,
        endDate: end,
        lectureTime: module.lectureTime,
      });
      // Notify batch students: new module starting from scheduled date/time with link
      const directMeetingUrl = toAbsoluteMeetingUrl(module.meetingLink);
      if (directMeetingUrl) {
        const batchStudents = await prisma.liveLectureBatchStudent.findMany({
          where: { batchId: module.batchId },
          include: { student: { select: { email: true, profile: { select: { fullName: true } } } } },
        });
        const startStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const endStr = end.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = String(module.lectureTime).trim();
        for (const bs of batchStudents) {
          await emailService.sendNewModuleStartingEmail(
            bs.student.email,
            bs.student.profile?.fullName ?? undefined,
            module.name,
            startStr,
            endStr,
            timeStr,
            directMeetingUrl
          );
        }
      }
      res.status(201).json(module);
    } catch (error: unknown) {
      console.error('Create module error:', error);
      res.status(500).json({ error: 'Failed to create module' });
    }
  },

  updateModule: async (req: Request, res: Response): Promise<void> => {
    try {
      const { moduleId } = req.params;
      const { name, instructorId, meetingLink, startDate, endDate, lectureTime } = req.body;
      const mod = await prisma.liveLectureModule.update({
        where: { id: moduleId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(instructorId && { instructorId }),
          ...(meetingLink !== undefined && { meetingLink: meetingLink?.trim() || null }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(lectureTime !== undefined && { lectureTime: String(lectureTime).trim() }),
        },
        include: {
          instructor: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        },
      });
      await prisma.liveLecture.deleteMany({ where: { moduleId } });
      await createLecturesForModule({
        id: mod.id,
        batchId: mod.batchId,
        instructorId: mod.instructorId,
        name: mod.name,
        meetingLink: mod.meetingLink,
        startDate: mod.startDate,
        endDate: mod.endDate,
        lectureTime: mod.lectureTime,
      });
      res.json(mod);
    } catch (error: unknown) {
      console.error('Update module error:', error);
      res.status(500).json({ error: 'Failed to update module' });
    }
  },

  deleteModule: async (req: Request, res: Response): Promise<void> => {
    try {
      const { moduleId } = req.params;
      await prisma.liveLectureModule.delete({ where: { id: moduleId } });
      res.json({ message: 'Module deleted' });
    } catch (error: unknown) {
      console.error('Delete module error:', error);
      res.status(500).json({ error: 'Failed to delete module' });
    }
  },

  /**
   * Run module reminders: send link 10 min before lecture time every day while module is active.
   * Runs every 1 min so we never miss the window. Lecture time is in SERVER local timezone (set TZ=Asia/Kolkata when running for India).
   */
  /**
   * Run module reminders: send link 1 hour, 30 min, and 10 min before lecture time every day.
   * Cron runs every 1 min. Each reminder is sent once per day when we hit that minute window.
   */
  runModuleReminders: async (): Promise<void> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const oneMinMs = 5 * 60 * 1000; // 5-min window matches the 5-min poll interval

    const modules = await prisma.liveLectureModule.findMany({
      where: {
        meetingLink: { not: null },
        batch: { type: LiveLectureBatchType.REGULAR },
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      include: {
        batch: { select: { id: true, name: true } },
        instructor: { select: { profile: { select: { fullName: true } } } },
      },
    });

    if (modules.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Live Lecture] Reminder check: ${modules.length} module(s) (today ${todayStart.toISOString().slice(0, 10)}, now ${now.toTimeString().slice(0, 8)})`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    for (const mod of modules) {
      const directMeetingUrl = toAbsoluteMeetingUrl(mod.meetingLink);
      if (!directMeetingUrl) continue;

      const parts = mod.lectureTime.split(':').map(Number);
      const hh = Number.isNaN(parts[0]) ? 10 : parts[0];
      const mm = Number.isNaN(parts[1]) ? 0 : parts[1];
      const lectureToday = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), hh, mm, 0);
      const oneHourBefore = new Date(lectureToday.getTime() - 60 * 60 * 1000);
      const thirtyMinBefore = new Date(lectureToday.getTime() - 30 * 60 * 1000);
      const tenMinBefore = new Date(lectureToday.getTime() - 10 * 60 * 1000);
      const displayTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

      const todayLecture = await prisma.liveLecture.findFirst({
        where: {
          moduleId: mod.id,
          scheduledAt: { gte: todayStart, lt: tomorrowStart },
        },
        select: { id: true },
      });
      const joinUrl = todayLecture
        ? `${frontendUrl}/student/live-lectures/join?lectureId=${todayLecture.id}`
        : directMeetingUrl;

      const sent1h = mod.lastReminder1hSentAt ?? null;
      const sent30m = mod.lastReminder30mSentAt ?? null;
      const sent10m = mod.lastReminderSentAt ?? null;
      const alreadySent1hToday = sent1h != null && sent1h >= todayStart;
      const alreadySent30mToday = sent30m != null && sent30m >= todayStart;
      const alreadySent10mToday = sent10m != null && sent10m >= todayStart;

      // 1-hour window: now in [oneHourBefore, oneHourBefore+1min)
      if (
        !alreadySent1hToday &&
        now.getTime() >= oneHourBefore.getTime() &&
        now.getTime() < oneHourBefore.getTime() + oneMinMs
      ) {
        const batchStudents = await prisma.liveLectureBatchStudent.findMany({
          where: { batchId: mod.batchId },
          include: { student: { select: { email: true, profile: { select: { fullName: true } } } } },
        });
        let sent = 0;
        for (const bs of batchStudents) {
          const ok = await emailService.sendLiveLectureModuleReminderEmail(
            bs.student.email,
            bs.student.profile?.fullName ?? undefined,
            mod.name,
            joinUrl,
            displayTime,
            60
          );
          if (ok) sent++;
        }
        await prisma.liveLectureModule.update({
          where: { id: mod.id },
          data: { lastReminder1hSentAt: now },
        });
        console.log(`[Live Lecture] Sent 1h reminder: ${sent} for "${mod.name}" (${mod.batch.name}) at ${displayTime}`);
      }

      // 30-min window: now in [thirtyMinBefore, thirtyMinBefore+1min)
      if (
        !alreadySent30mToday &&
        now.getTime() >= thirtyMinBefore.getTime() &&
        now.getTime() < thirtyMinBefore.getTime() + oneMinMs
      ) {
        const batchStudents = await prisma.liveLectureBatchStudent.findMany({
          where: { batchId: mod.batchId },
          include: { student: { select: { email: true, profile: { select: { fullName: true } } } } },
        });
        let sent = 0;
        for (const bs of batchStudents) {
          const ok = await emailService.sendLiveLectureModuleReminderEmail(
            bs.student.email,
            bs.student.profile?.fullName ?? undefined,
            mod.name,
            joinUrl,
            displayTime,
            30
          );
          if (ok) sent++;
        }
        await prisma.liveLectureModule.update({
          where: { id: mod.id },
          data: { lastReminder30mSentAt: now },
        });
        console.log(`[Live Lecture] Sent 30m reminder: ${sent} for "${mod.name}" (${mod.batch.name}) at ${displayTime}`);
      }

      // 10-min window: now in [tenMinBefore, tenMinBefore+1min)
      if (
        !alreadySent10mToday &&
        now.getTime() >= tenMinBefore.getTime() &&
        now.getTime() < tenMinBefore.getTime() + oneMinMs
      ) {
        const batchStudents = await prisma.liveLectureBatchStudent.findMany({
          where: { batchId: mod.batchId },
          include: { student: { select: { email: true, profile: { select: { fullName: true } } } } },
        });
        let sent = 0;
        for (const bs of batchStudents) {
          const ok = await emailService.sendLiveLectureModuleReminderEmail(
            bs.student.email,
            bs.student.profile?.fullName ?? undefined,
            mod.name,
            joinUrl,
            displayTime,
            10
          );
          if (ok) sent++;
        }
        await prisma.liveLectureModule.update({
          where: { id: mod.id },
          data: { lastReminderSentAt: now },
        });
        console.log(`[Live Lecture] Sent 10m reminder: ${sent} for "${mod.name}" (${mod.batch.name}) at ${displayTime}`);
      }
    }
  },

  listBatchStudents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId } = req.params;
      const students = await prisma.liveLectureBatchStudent.findMany({
        where: { batchId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      });
      res.json(students);
    } catch (error: unknown) {
      console.error('List batch students error:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  },

  addStudentToBatch: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId, studentId } = req.params;
      const userId = req.user?.id;

      const student = await prisma.user.findFirst({
        where: { id: studentId, role: UserRole.STUDENT },
      });
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      await prisma.liveLectureBatchStudent.upsert({
        where: {
          batchId_studentId: { batchId, studentId },
        },
        create: { batchId, studentId, addedBy: userId },
        update: {},
      });

      // Send "added to batch" email to the student
      const batch = await prisma.liveLectureBatch.findUnique({
        where: { id: batchId },
        select: { name: true },
      });
      if (batch) {
        const studentWithProfile = await prisma.user.findUnique({
          where: { id: studentId },
          select: { email: true, profile: { select: { fullName: true } } },
        });
        if (studentWithProfile) {
          emailService.sendAddedToBatchEmail(
            studentWithProfile.email,
            studentWithProfile.profile?.fullName ?? undefined,
            batch.name
          ).catch(err => console.error('Failed to send added-to-batch email:', err));
        }
      }

      const list = await prisma.liveLectureBatchStudent.findMany({
        where: { batchId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });
      res.status(201).json(list);
    } catch (error: unknown) {
      console.error('Add student to batch error:', error);
      res.status(500).json({ error: 'Failed to add student' });
    }
  },

  removeStudentFromBatch: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId, studentId } = req.params;
      await prisma.liveLectureBatchStudent.delete({
        where: { batchId_studentId: { batchId, studentId } },
      });
      res.json({ message: 'Student removed from batch' });
    } catch (error: unknown) {
      console.error('Remove student from batch error:', error);
      res.status(500).json({ error: 'Failed to remove student' });
    }
  },

  // ========== LECTURES (Admin: CRUD; Student: list my lectures) ==========
  listLecturesAdmin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId, upcoming } = req.query;
      const where: Record<string, unknown> = {};
      if (batchId && typeof batchId === 'string') where.batchId = batchId;
      if (upcoming === 'true') {
        where.scheduledAt = { gte: new Date() };
      } else if (upcoming === 'false') {
        where.scheduledAt = { lt: new Date() };
      }

      const lectures = await prisma.liveLecture.findMany({
        where,
        include: {
          batch: { select: { id: true, name: true } },
          instructor: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          module: { select: { id: true, name: true } },
          _count: { select: { attendances: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      });
      res.json(lectures);
    } catch (error: unknown) {
      console.error('List lectures (admin) error:', error);
      res.status(500).json({ error: 'Failed to fetch lectures' });
    }
  },

  listLecturesStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const batchStudents = await prisma.liveLectureBatchStudent.findMany({
        where: { studentId: userId },
        select: { batchId: true },
      });
      const batchIds = batchStudents.map((b) => b.batchId);
      if (batchIds.length === 0) {
        res.json({ upcoming: [], past: [] });
        return;
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowEnd = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000 - 1); // end of tomorrow 23:59:59.999

      const lectures = await prisma.liveLecture.findMany({
        where: { batchId: { in: batchIds } },
        include: {
          batch: { select: { id: true, name: true } },
          instructor: {
            select: {
              id: true,
              profile: { select: { fullName: true } },
            },
          },
          attendances: {
            where: { studentId: userId },
            select: { attended: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      });

      // Upcoming: only today and tomorrow, and only if lecture time hasn't passed yet
      const nowMs = now.getTime();
      const upcoming = lectures
        .filter((l) => {
          const t = new Date(l.scheduledAt).getTime();
          return t >= nowMs && t >= todayStart.getTime() && t <= tomorrowEnd.getTime();
        })
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      const past = lectures.filter((l) => new Date(l.scheduledAt) < todayStart);
      res.json({ upcoming, past });
    } catch (error: unknown) {
      console.error('List lectures (student) error:', error);
      res.status(500).json({ error: 'Failed to fetch lectures' });
    }
  },

  /** Student: summary of batches I'm in (for dashboard & My Learning) */
  getMyBatchesSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const batchStudents = await prisma.liveLectureBatchStudent.findMany({
        where: { studentId: userId },
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              modules: {
                select: { id: true, name: true, startDate: true, endDate: true },
                orderBy: { startDate: 'asc' },
              },
            },
          },
        },
      });
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const batchIds = batchStudents.map((b) => b.batch.id);
      if (batchIds.length === 0) {
        res.json({ batches: [] });
        return;
      }

      const lectures = await prisma.liveLecture.findMany({
        where: { batchId: { in: batchIds }, scheduledAt: { lt: now } },
        select: {
          id: true,
          batchId: true,
          recordingUrl: true,
          attendances: {
            where: { studentId: userId },
            select: { attended: true },
          },
        },
      });
      const attendedSet = new Set(
        lectures.filter((l) => l.attendances[0]?.attended).map((l) => l.id),
      );
      const recordedCountByBatch: Record<string, number> = {};
      const totalByBatch: Record<string, number> = {};
      const attendedByBatch: Record<string, number> = {};
      for (const l of lectures) {
        totalByBatch[l.batchId] = (totalByBatch[l.batchId] ?? 0) + 1;
        if (l.recordingUrl) recordedCountByBatch[l.batchId] = (recordedCountByBatch[l.batchId] ?? 0) + 1;
        if (attendedSet.has(l.id)) attendedByBatch[l.batchId] = (attendedByBatch[l.batchId] ?? 0) + 1;
      }

      const batches = batchStudents.map((bs) => {
        const batch = bs.batch;
        const currentModule = batch.modules.find((m) => {
          const start = new Date(m.startDate);
          const end = new Date(m.endDate);
          end.setHours(23, 59, 59, 999);
          return todayStart >= start && todayStart <= end;
        });
        return {
          batchId: batch.id,
          batchName: batch.name,
          currentModuleName: currentModule?.name ?? null,
          totalPastLectures: totalByBatch[batch.id] ?? 0,
          recordedCount: recordedCountByBatch[batch.id] ?? 0,
          attendedCount: attendedByBatch[batch.id] ?? 0,
        };
      });
      res.json({ batches });
    } catch (error: unknown) {
      console.error('Get my batches summary error:', error);
      res.status(500).json({ error: 'Failed to fetch batches summary' });
    }
  },

  createLecture: async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId, instructorId, title, meetingLink, scheduledAt, durationMinutes } = req.body;
      if (!batchId || !instructorId || !title || !scheduledAt) {
        res.status(400).json({ error: 'Batch, instructor, title and scheduled time are required' });
        return;
      }
      const lecture = await prisma.liveLecture.create({
        data: {
          batchId,
          instructorId,
          title: title.trim(),
          meetingLink: meetingLink?.trim() || null,
          scheduledAt: new Date(scheduledAt),
          durationMinutes: durationMinutes ?? 60,
        },
        include: {
          batch: { select: { id: true, name: true } },
          instructor: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
      });
      res.status(201).json(lecture);
    } catch (error: unknown) {
      console.error('Create lecture error:', error);
      res.status(500).json({ error: 'Failed to create lecture' });
    }
  },

  updateLecture: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { batchId, instructorId, title, meetingLink, scheduledAt, durationMinutes } = req.body;
      const lecture = await prisma.liveLecture.update({
        where: { id },
        data: {
          ...(batchId && { batchId }),
          ...(instructorId && { instructorId }),
          ...(title !== undefined && { title: title.trim() }),
          ...(meetingLink !== undefined && { meetingLink: meetingLink?.trim() || null }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
          ...(durationMinutes !== undefined && { durationMinutes }),
        },
        include: {
          batch: { select: { id: true, name: true } },
          instructor: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        },
      });
      res.json(lecture);
    } catch (error: unknown) {
      console.error('Update lecture error:', error);
      res.status(500).json({ error: 'Failed to update lecture' });
    }
  },

  deleteLecture: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.liveLecture.delete({ where: { id } });
      res.json({ message: 'Lecture deleted' });
    } catch (error: unknown) {
      console.error('Delete lecture error:', error);
      res.status(500).json({ error: 'Failed to delete lecture' });
    }
  },

  // ========== ATTENDANCE (Admin) ==========
  getLectureAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const lecture = await prisma.liveLecture.findUnique({
        where: { id: lectureId },
        include: {
          batch: { select: { name: true } },
          instructor: { select: { profile: { select: { fullName: true } } } },
        },
      });
      if (!lecture) {
        res.status(404).json({ error: 'Lecture not found' });
        return;
      }
      const batchStudents = await prisma.liveLectureBatchStudent.findMany({
        where: { batchId: lecture.batchId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });
      const attendances = await prisma.liveLectureAttendance.findMany({
        where: { lectureId },
      });
      const byStudent = Object.fromEntries(attendances.map((a) => [a.studentId, a.attended]));

      const list = batchStudents.map((bs) => ({
        studentId: bs.student.id,
        email: bs.student.email,
        fullName: bs.student.profile?.fullName ?? null,
        attended: byStudent[bs.student.id] ?? false,
      }));
      res.json({ lecture, students: list });
    } catch (error: unknown) {
      console.error('Get lecture attendance error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  },

  markAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const { studentId, attended } = req.body;
      const userId = req.user?.id;

      if (!studentId || typeof attended !== 'boolean') {
        res.status(400).json({ error: 'studentId and attended (boolean) are required' });
        return;
      }

      await prisma.liveLectureAttendance.upsert({
        where: {
          lectureId_studentId: { lectureId, studentId },
        },
        create: { lectureId, studentId, attended, markedBy: userId },
        update: { attended, markedBy: userId },
      });
      if (attended) {
        // Attendance recorded
      }
      const list = await prisma.liveLectureAttendance.findMany({
        where: { lectureId },
      });
      res.json(list);
    } catch (error: unknown) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ error: 'Failed to mark attendance' });
    }
  },

  markAttendanceBulk: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const { attendances } = req.body as { attendances: { studentId: string; attended: boolean }[] };
      const userId = req.user?.id;

      if (!Array.isArray(attendances)) {
        res.status(400).json({ error: 'attendances array is required' });
        return;
      }

      await Promise.all(
        attendances.map((a: { studentId: string; attended: boolean }) =>
          prisma.liveLectureAttendance.upsert({
            where: {
              lectureId_studentId: { lectureId, studentId: a.studentId },
            },
            create: { lectureId, studentId: a.studentId, attended: a.attended, markedBy: userId },
            update: { attended: a.attended, markedBy: userId },
          })
        )
      );
      const list = await prisma.liveLectureAttendance.findMany({
        where: { lectureId },
      });
      res.json(list);
    } catch (error: unknown) {
      console.error('Mark attendance bulk error:', error);
      res.status(500).json({ error: 'Failed to mark attendance' });
    }
  },

  // ========== RECORDING (Admin) ==========
  getRecordingUploadUrl: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const { fileName, fileType } = req.body;
      const lecture = await prisma.liveLecture.findUnique({ where: { id: lectureId } });
      if (!lecture) {
        res.status(404).json({ error: 'Lecture not found' });
        return;
      }
      const key = `live-lectures/${lectureId}/${Date.now()}_${fileName}`;
      const uploadUrl = await s3Service.getUploadUrl(key, fileType);
      res.json({ uploadUrl, fileUrl: key, fileName });
    } catch (error: unknown) {
      console.error('Get recording upload URL error:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  },

  uploadRecording: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const { recordingUrl } = req.body;
      const lecture = await prisma.liveLecture.update({
        where: { id: lectureId },
        data: { recordingUrl },
        include: {
          batch: { select: { id: true, name: true } },
        },
      });
      // Notify all students in this batch: email with link to view recording
      const batchStudents = await prisma.liveLectureBatchStudent.findMany({
        where: { batchId: lecture.batchId },
        include: {
          student: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const viewLink = `${frontendUrl}/student/live-lectures?recording=${lectureId}`;
      let emailsSent = 0;
      for (const bs of batchStudents) {
        const ok = await emailService
          .sendLiveLectureRecordingEmail(
            bs.student.email,
            bs.student.profile?.fullName ?? undefined,
            lecture.title,
            viewLink
          )
          .catch((err) => {
            console.error('Failed to send recording email to', bs.student.email, err);
            return false;
          });
        if (ok) emailsSent++;
      }
      res.json({ message: 'Recording saved', lecture, emailsSent });
    } catch (error: unknown) {
      console.error('Upload recording error:', error);
      res.status(500).json({ error: 'Failed to save recording' });
    }
  },

  // ========== DAILY NOTIFICATIONS (Admin) ==========
  sendDailyNotifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const todayLectures = await prisma.liveLecture.findMany({
        where: {
          scheduledAt: { gte: start, lt: end },
          meetingLink: { not: null },
        },
        include: {
          batch: { select: { id: true } },
          instructor: { select: { profile: { select: { fullName: true } } } },
        },
      });

      const batchIds = [...new Set(todayLectures.map((l) => l.batchId))];
      const batchStudents = await prisma.liveLectureBatchStudent.findMany({
        where: { batchId: { in: batchIds } },
        include: {
          student: {
            select: { id: true, email: true, profile: { select: { fullName: true } } },
          },
        },
      });

      const lecturesByBatch = new Map<string, typeof todayLectures>();
      for (const l of todayLectures) {
        if (!lecturesByBatch.has(l.batchId)) lecturesByBatch.set(l.batchId, []);
        lecturesByBatch.get(l.batchId)!.push(l);
      }

      const studentBatches = new Map<string, string[]>();
      for (const bs of batchStudents) {
        if (!studentBatches.has(bs.studentId)) studentBatches.set(bs.studentId, []);
        studentBatches.get(bs.studentId)!.push(bs.batchId);
      }

      let sent = 0;
      const studentList = await prisma.user.findMany({
        where: { id: { in: [...studentBatches.keys()] } },
        select: { id: true, email: true, profile: { select: { fullName: true } } },
      });

      for (const student of studentList) {
        const batchIdsForStudent = studentBatches.get(student.id) ?? [];
        const lecturesForStudent: typeof todayLectures = [];
        for (const bid of batchIdsForStudent) {
          const list = lecturesByBatch.get(bid) ?? [];
          lecturesForStudent.push(...list);
        }
        if (lecturesForStudent.length === 0) continue;

        const payload = lecturesForStudent.map((l) => ({
          title: l.title,
          meetingLink: toAbsoluteMeetingUrl(l.meetingLink) ?? l.meetingLink ?? '',
          scheduledAt: l.scheduledAt,
          instructorName: l.instructor.profile?.fullName ?? undefined,
        }));
        const ok = await emailService.sendLiveLectureDailyEmail(
          student.email,
          student.profile?.fullName ?? undefined,
          payload
        );
        if (ok) sent++;
      }

      res.json({
        message: 'Daily notifications sent',
        todayLecturesCount: todayLectures.length,
        studentsNotified: sent,
      });
    } catch (error: unknown) {
      console.error('Send daily notifications error:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  },

  // Student: click join link from email → mark attendance, return meeting URL to redirect
  getJoinRedirect: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const lecture = await prisma.liveLecture.findUnique({
        where: { id: lectureId },
        select: { id: true, batchId: true, meetingLink: true },
      });
      if (!lecture) {
        res.status(404).json({ error: 'Lecture not found' });
        return;
      }
      if (!lecture.meetingLink) {
        res.status(400).json({ error: 'No meeting link for this lecture' });
        return;
      }

      const isInBatch = await prisma.liveLectureBatchStudent.findUnique({
        where: { batchId_studentId: { batchId: lecture.batchId, studentId: userId } },
      });
      if (!isInBatch) {
        res.status(403).json({ error: 'Not in this batch' });
        return;
      }

      await prisma.liveLectureAttendance.upsert({
        where: {
          lectureId_studentId: { lectureId, studentId: userId },
        },
        create: { lectureId, studentId: userId, attended: true },
        update: { attended: true },
      });

      const redirectUrl = toAbsoluteMeetingUrl(lecture.meetingLink);
      if (!redirectUrl) {
        res.status(400).json({ error: 'No meeting link for this lecture' });
        return;
      }
      res.json({ redirectUrl });
    } catch (error: unknown) {
      console.error('Join redirect error:', error);
      res.status(500).json({ error: 'Failed to join' });
    }
  },

  // Student: get watch URL for a lecture recording
  getRecordingWatchUrl: async (req: Request, res: Response): Promise<void> => {
    try {
      const { lectureId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const lecture = await prisma.liveLecture.findUnique({
        where: { id: lectureId },
        include: { batch: { select: { id: true } } },
      });
      if (!lecture || !lecture.recordingUrl) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      const isInBatch = await prisma.liveLectureBatchStudent.findUnique({
        where: { batchId_studentId: { batchId: lecture.batchId, studentId: userId } },
      });
      if (!isInBatch) {
        res.status(403).json({ error: 'Not allowed to view this recording' });
        return;
      }

      const recordingUrl = lecture.recordingUrl;
      const isS3Key = !recordingUrl.startsWith('http');
      const url = isS3Key ? await s3Service.getDownloadUrl(recordingUrl, 7200) : recordingUrl;
      res.json({ url });
    } catch (error: unknown) {
      console.error('Get recording watch URL error:', error);
      res.status(500).json({ error: 'Failed to get recording URL' });
    }
  },
};
