import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

class StudentInstructorController {
  /**
   * Assign instructor to student (Admin)
   * POST /api/admin/students/:studentId/instructor
   */
  assignInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { instructorId } = req.body;
      const adminId = req.user?.id;

      if (!instructorId) {
        res.status(400).json({ error: 'Instructor ID is required' });
        return;
      }

      // Verify student exists and is a student
      const student = await prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student || student.role !== UserRole.STUDENT) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify instructor exists and is an instructor
      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor || instructor.role !== UserRole.INSTRUCTOR) {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      // Create or update assignment
      const assignment = await prisma.studentInstructor.upsert({
        where: {
          studentId_instructorId: {
            studentId,
            instructorId,
          },
        },
        update: {
          assignedBy: adminId || null,
        },
        create: {
          studentId,
          instructorId,
          assignedBy: adminId || null,
        },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          instructor: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });

      res.json({
        message: 'Instructor assigned successfully',
        assignment,
      });
    } catch (error: unknown) {
      console.error('Assign instructor error:', error);
      res.status(500).json({ error: 'Failed to assign instructor' });
    }
  };

  /**
   * Remove instructor from student (Admin)
   * DELETE /api/admin/students/:studentId/instructor/:instructorId
   */
  removeInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, instructorId } = req.params;

      await prisma.studentInstructor.delete({
        where: {
          studentId_instructorId: {
            studentId,
            instructorId,
          },
        },
      });

      res.json({ message: 'Instructor removed successfully' });
    } catch (error: unknown) {
      console.error('Remove instructor error:', error);
      res.status(500).json({ error: 'Failed to remove instructor' });
    }
  };

  /**
   * Get student's assigned instructors
   * GET /api/students/:studentId/instructors
   */
  getStudentInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;

      const assignments = await prisma.studentInstructor.findMany({
        where: { studentId },
        include: {
          instructor: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      res.json(assignments.map(a => a.instructor));
    } catch (error: unknown) {
      console.error('Get student instructors error:', error);
      res.status(500).json({ error: 'Failed to fetch instructors' });
    }
  };

  /**
   * Get instructor's assigned students
   * GET /api/instructors/:instructorId/students
   */
  getInstructorStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instructorId } = req.params;

      const assignments = await prisma.studentInstructor.findMany({
        where: { instructorId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      res.json(assignments.map(a => a.student));
    } catch (error: unknown) {
      console.error('Get instructor students error:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  };

  /**
   * Get my assigned students with full details (list + export)
   * GET /api/student-instructors/my-students
   * For authenticated instructor: returns students with phone, enrollments, progress for table and Excel.
   */
  getMyAssignedStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const assignments = await prisma.studentInstructor.findMany({
        where: { instructorId },
        include: {
          student: {
            include: {
              profile: true,
              enrollments: {
                include: {
                  course: {
                    include: {
                      modules: { include: { videos: { select: { id: true } } } },
                      videos: { select: { id: true } },
                    },
                  },
                },
              },
              videoProgress: {
                where: { isCompleted: true },
                select: { videoId: true },
              },
            },
          },
        },
      });

      const students = assignments.map((a) => a.student).filter(Boolean);
      const completedVideoIdsByUser = new Map<string, Set<string>>();
      students.forEach((s) => {
        completedVideoIdsByUser.set(s.id, new Set(s.videoProgress.map((vp) => vp.videoId)));
      });

      const rows = students.map((s) => {
        const completedIds = completedVideoIdsByUser.get(s.id) ?? new Set<string>();
        const enrollmentsWithProgress = s.enrollments.map((e) => {
          const totalVideos =
            (e.course.modules?.reduce((sum, m) => sum + (m.videos?.length ?? 0), 0) ?? 0) +
            (e.course.videos?.length ?? 0);
          let completed = 0;
          e.course.modules?.forEach((m) => {
            m.videos?.forEach((v) => {
              if (completedIds.has(v.id)) completed++;
            });
          });
          (e.course.videos ?? []).forEach((v) => {
            if (completedIds.has(v.id)) completed++;
          });
          const percent = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;
          return { title: e.course.title, percent, enrolledAt: e.enrolledAt, completedAt: e.completedAt };
        });
        const courseNames = enrollmentsWithProgress.map((e) => e.title).join('; ');
        const progressText = enrollmentsWithProgress.map((e) => `${e.title}: ${e.percent}%`).join('; ');
        return {
          id: s.id,
          fullName: s.profile?.fullName ?? '',
          email: s.email,
          phoneNumber: s.profile?.phoneNumber ?? '',
          createdAt: s.createdAt,
          isBlocked: s.profile?.isBlocked ?? false,
          enrolledCourses: s.enrollments.length,
          courseNames,
          progressText,
          enrollments: enrollmentsWithProgress,
        };
      });

      res.json(rows);
    } catch (error: unknown) {
      console.error('Get my assigned students error:', error);
      res.status(500).json({ error: 'Failed to fetch assigned students' });
    }
  };
}

export const studentInstructorController = new StudentInstructorController();
