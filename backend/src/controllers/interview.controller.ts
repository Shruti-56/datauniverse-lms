import { Request, Response } from 'express';
import { InterviewStatus, UserRole } from '@prisma/client';
import { emailService } from '../services/email.service';
import { s3Service } from '../services/s3.service';
import { prisma } from '../lib/prisma';

/** Shape used by email helpers (from Prisma include) */
interface InterviewWithRelations {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink: string | null;
  student: { email: string; profile?: { fullName: string | null; phoneNumber: string | null } | null };
  instructor: { email: string; profile?: { fullName: string | null } | null };
}

interface InterviewFeedbackShape {
  overallRating: number;
  communicationSkills: number;
  theoryKnowledge: number;
  practicalKnowledge: number;
  codingKnowledge: number;
}

class InterviewController {
  /**
   * Schedule mock interview (Admin/Instructor)
   * POST /api/admin/interviews
   */
  scheduleInterview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, instructorId, scheduledAt, durationMinutes, meetingLink } = req.body;

      if (!studentId || !instructorId || !scheduledAt) {
        res.status(400).json({ error: 'Student ID, Instructor ID, and scheduled time are required' });
        return;
      }

      // Verify student
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: { profile: true },
      });

      if (!student || student.role !== UserRole.STUDENT) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify instructor
      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
        include: { profile: true },
      });

      if (!instructor || instructor.role !== UserRole.INSTRUCTOR) {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate < new Date()) {
        res.status(400).json({ error: 'Scheduled time must be in the future' });
        return;
      }

      const interview = await prisma.interview.create({
        data: {
          studentId,
          instructorId,
          scheduledAt: scheduledDate,
          durationMinutes: durationMinutes || 60,
          meetingLink: meetingLink || null,
          status: InterviewStatus.SCHEDULED,
        },
        include: {
          student: { include: { profile: true } },
          instructor: { include: { profile: true } },
        },
      });

      // Send immediate confirmation emails to both student and instructor
      this.sendInterviewScheduledEmail(interview);

      // Schedule reminder emails (10 minutes before)
      // For production, use a job queue service
      this.scheduleReminderEmail(interview);

      res.status(201).json({
        message: 'Interview scheduled successfully',
        interview,
      });
    } catch (error: unknown) {
      console.error('Schedule interview error:', error);
      res.status(500).json({ error: 'Failed to schedule interview' });
    }
  };

  /**
   * Get interviews (Student/Instructor/Admin)
   * GET /api/interviews
   */
  getInterviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.roles?.[0];
      const { status } = req.query;

      const whereClause: Record<string, unknown> = {};

      if (userRole === UserRole.STUDENT) {
        whereClause.studentId = userId;
      } else if (userRole === UserRole.INSTRUCTOR) {
        whereClause.instructorId = userId;
      }
      // Admin sees all

      if (status) {
        whereClause.status = status as InterviewStatus;
      }

      // Instructor: soonest first (asc). Student/Admin: most recent first (desc).
      const orderByTime = userRole === UserRole.INSTRUCTOR ? 'asc' : 'desc';
      const interviews = await prisma.interview.findMany({
        where: whereClause,
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
          feedback: true,
        },
        orderBy: { scheduledAt: orderByTime },
      });

      res.json(interviews);
    } catch (error: unknown) {
      console.error('Get interviews error:', error);
      res.status(500).json({ error: 'Failed to fetch interviews' });
    }
  };

  /**
   * Mark interview attendance (Instructor)
   * PUT /api/interviews/:id/attendance
   */
  markAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { attended } = req.body;
      const userId = req.user?.id;

      const interview = await prisma.interview.findUnique({
        where: { id },
      });

      if (!interview) {
        res.status(404).json({ error: 'Interview not found' });
        return;
      }

      if (interview.instructorId !== userId) {
        res.status(403).json({ error: 'Only assigned instructor can mark attendance' });
        return;
      }

      const updated = await prisma.interview.update({
        where: { id },
        data: {
          attended: attended === true,
          attendedAt: attended === true ? new Date() : null,
          status: attended === true ? InterviewStatus.COMPLETED : InterviewStatus.MISSED,
        },
        include: {
          student: { include: { profile: true } },
          instructor: { include: { profile: true } },
        },
      });

      // If interview is marked as completed, send email to instructor with feedback link
      if (attended === true && updated.status === InterviewStatus.COMPLETED) {
        this.sendInterviewFeedbackRequestEmail(updated);
      }

      res.json({
        message: `Attendance marked as ${attended ? 'attended' : 'not attended'}`,
        interview: updated,
      });
    } catch (error: unknown) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ error: 'Failed to mark attendance' });
    }
  };

  /**
   * Submit interview feedback (Instructor)
   * POST /api/interviews/:id/feedback
   */
  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        communicationSkills,
        theoryKnowledge,
        practicalKnowledge,
        codingKnowledge,
        problemSolving,
        overallRating,
        strengths,
        areasForImprovement,
        additionalComments,
      } = req.body;
      const userId = req.user?.id;

      const interview = await prisma.interview.findUnique({
        where: { id },
        include: {
          student: { include: { profile: true } },
        },
      });

      if (!interview) {
        res.status(404).json({ error: 'Interview not found' });
        return;
      }

      if (interview.instructorId !== userId) {
        res.status(403).json({ error: 'Only assigned instructor can submit feedback' });
        return;
      }

      // Create or update feedback
      const feedback = await prisma.interviewFeedback.upsert({
        where: { interviewId: id },
        update: {
          communicationSkills: parseInt(communicationSkills),
          theoryKnowledge: parseInt(theoryKnowledge),
          practicalKnowledge: parseInt(practicalKnowledge),
          codingKnowledge: parseInt(codingKnowledge),
          problemSolving: parseInt(problemSolving),
          overallRating: parseInt(overallRating),
          strengths,
          areasForImprovement,
          additionalComments,
        },
        create: {
          interviewId: id,
          communicationSkills: parseInt(communicationSkills),
          theoryKnowledge: parseInt(theoryKnowledge),
          practicalKnowledge: parseInt(practicalKnowledge),
          codingKnowledge: parseInt(codingKnowledge),
          problemSolving: parseInt(problemSolving),
          overallRating: parseInt(overallRating),
          strengths,
          areasForImprovement,
          additionalComments,
        },
      });

      // Update interview status
      await prisma.interview.update({
        where: { id },
        data: { status: InterviewStatus.COMPLETED },
      });

      // Send feedback email to student
      if (interview.student) {
        this.sendFeedbackEmail(interview.student.email, interview.student.profile?.fullName, feedback);
      }

      res.json({
        message: 'Feedback submitted successfully',
        feedback,
      });
    } catch (error: unknown) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  };

  /**
   * Upload interview recording (Instructor)
   * PUT /api/interviews/:id/recording
   */
  uploadRecording = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { recordingUrl } = req.body;
      const userId = req.user?.id;

      const interview = await prisma.interview.findUnique({
        where: { id },
      });

      if (!interview) {
        res.status(404).json({ error: 'Interview not found' });
        return;
      }

      const userRole = req.user?.roles?.[0];
      const isAdmin = userRole === UserRole.ADMIN;
      const isAssignedInstructor = interview.instructorId === userId;
      if (!isAdmin && !isAssignedInstructor) {
        res.status(403).json({ error: 'Only assigned instructor or admin can upload recording' });
        return;
      }

      const updated = await prisma.interview.update({
        where: { id },
        data: { recordingUrl },
      });

      res.json({
        message: 'Recording uploaded successfully',
        interview: updated,
      });
    } catch (error: unknown) {
      console.error('Upload recording error:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  };

  /**
   * Get upload URL for recording (Instructor)
   * POST /api/interviews/:id/recording/upload-url
   */
  getRecordingUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fileName, fileType } = req.body;
      const userId = req.user?.id;

      const interview = await prisma.interview.findUnique({
        where: { id },
      });

      const userRole = req.user?.roles?.[0];
      const isAdmin = userRole === UserRole.ADMIN;
      const isAssignedInstructor = interview?.instructorId === userId;
      if (!interview || (!isAdmin && !isAssignedInstructor)) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const key = `interviews/${id}/${Date.now()}_${fileName}`;
      const uploadUrl = await s3Service.getUploadUrl(key, fileType);

      res.json({
        uploadUrl,
        fileUrl: key,
        fileName,
      });
    } catch (error: unknown) {
      console.error('Get recording upload URL error:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  };

  /**
   * Get signed/watch URL for interview recording (Student/Instructor/Admin)
   * GET /api/interviews/:id/recording-url
   */
  getRecordingWatchUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.roles?.[0];

      const interview = await prisma.interview.findUnique({
        where: { id },
      });

      if (!interview) {
        res.status(404).json({ error: 'Interview not found' });
        return;
      }

      if (!interview.recordingUrl) {
        res.status(404).json({ error: 'No recording available' });
        return;
      }

      const isAdmin = userRole === UserRole.ADMIN;
      const isInstructor = userRole === UserRole.INSTRUCTOR && interview.instructorId === userId;
      const isStudent = userRole === UserRole.STUDENT && interview.studentId === userId;
      if (!isAdmin && !isInstructor && !isStudent) {
        res.status(403).json({ error: 'Not allowed to view this recording' });
        return;
      }

      const recordingUrl = interview.recordingUrl;
      const isS3Key = !recordingUrl.startsWith('http://') && !recordingUrl.startsWith('https://');
      const url = isS3Key
        ? await s3Service.getDownloadUrl(recordingUrl, 7200)
        : recordingUrl;

      res.json({ url });
    } catch (error: unknown) {
      console.error('Get recording watch URL error:', error);
      res.status(500).json({ error: 'Failed to get recording URL' });
    }
  };

  /**
   * Cancel interview (Admin/Instructor)
   * PUT /api/interviews/:id/cancel
   */
  cancelInterview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.roles?.[0];

      const interview = await prisma.interview.findUnique({
        where: { id },
        include: {
          student: { include: { profile: true } },
          instructor: { include: { profile: true } },
        },
      });

      if (!interview) {
        res.status(404).json({ error: 'Interview not found' });
        return;
      }

      // Only admin or assigned instructor can cancel
      if (userRole !== UserRole.ADMIN && interview.instructorId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const updated = await prisma.interview.update({
        where: { id },
        data: { status: InterviewStatus.CANCELLED },
      });

      // Send cancellation email
      this.sendCancellationEmail(interview);

      res.json({
        message: 'Interview cancelled successfully',
        interview: updated,
      });
    } catch (error: unknown) {
      console.error('Cancel interview error:', error);
      res.status(500).json({ error: 'Failed to cancel interview' });
    }
  };

  // Email helper methods
  private sendInterviewScheduledEmail(interview: InterviewWithRelations) {
    const studentEmail = interview.student.email;
    const studentName = interview.student.profile?.fullName || 'Student';
    const instructorEmail = interview.instructor.email;
    const instructorName = interview.instructor.profile?.fullName || 'Instructor';
    const scheduledTime = new Date(interview.scheduledAt).toLocaleString('en-IN');

    // Email to Student
    const studentHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Mock Interview Scheduled</h2>
          <p style="color: #4b5563;">Hi ${studentName},</p>
          <p style="color: #4b5563;">Your mock interview has been scheduled:</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Instructor:</strong> ${instructorName}</p>
            <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${scheduledTime}</p>
            <p style="margin: 4px 0;"><strong>Duration:</strong> ${interview.durationMinutes} minutes</p>
            ${interview.meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link (Teams/Meet):</strong> <a href="${interview.meetingLink}" target="_blank">Open in new tab</a></p>` : ''}
          </div>
          <p style="color: #4b5563;">You will receive a reminder 10 minutes before the interview.</p>
        </div>
      </body>
      </html>
    `;

    // Email to Instructor
    const instructorHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Mock Interview Scheduled</h2>
          <p style="color: #4b5563;">Hi ${instructorName},</p>
          <p style="color: #4b5563;">You have a mock interview scheduled:</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin: 4px 0;"><strong>Student Email:</strong> ${studentEmail}</p>
            ${interview.student.profile?.phoneNumber ? `<p style="margin: 4px 0;"><strong>Student Phone:</strong> ${interview.student.profile.phoneNumber}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${scheduledTime}</p>
            <p style="margin: 4px 0;"><strong>Duration:</strong> ${interview.durationMinutes} minutes</p>
            ${interview.meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link (Teams/Meet):</strong> <a href="${interview.meetingLink}" target="_blank">Open in new tab</a></p>` : ''}
          </div>
          <p style="color: #4b5563;">You will receive a reminder 10 minutes before the interview.</p>
        </div>
      </body>
      </html>
    `;

    // Send email to student
    emailService.sendEmail({
      to: studentEmail,
      subject: 'Mock Interview Scheduled - DataUniverse',
      html: studentHtml,
    }).catch(err => console.error('Failed to send interview email to student:', err));

    // Send email to instructor
    emailService.sendEmail({
      to: instructorEmail,
      subject: 'Mock Interview Scheduled - DataUniverse',
      html: instructorHtml,
    }).catch(err => console.error('Failed to send interview email to instructor:', err));
  }

  private scheduleReminderEmail(interview: InterviewWithRelations) {
    const scheduledTime = new Date(interview.scheduledAt);
    const reminderTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000); // 10 minutes before
    const now = new Date();

    if (reminderTime < now) {
      // Interview is less than 10 minutes away, send immediately
      this.sendReminderEmail(interview);
      return;
    }

    // Calculate delay in milliseconds
    const delay = reminderTime.getTime() - now.getTime();

    // Schedule reminder using setTimeout (for production, use a job queue)
    setTimeout(() => {
      this.sendReminderEmail(interview);
    }, delay);
  }

  private sendReminderEmail(interview: InterviewWithRelations) {
    const studentEmail = interview.student.email;
    const studentName = interview.student.profile?.fullName || 'Student';
    const instructorEmail = interview.instructor.email;
    const instructorName = interview.instructor.profile?.fullName || 'Instructor';
    const scheduledTime = new Date(interview.scheduledAt).toLocaleString('en-IN');

    // Reminder email to Student
    const studentHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">⏰ Interview Reminder</h2>
          <p style="color: #4b5563;">Hi ${studentName},</p>
          <p style="color: #4b5563;"><strong>Your mock interview starts in 10 minutes!</strong></p>
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Instructor:</strong> ${instructorName}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${scheduledTime}</p>
            ${interview.meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link (Teams/Meet):</strong> <a href="${interview.meetingLink}" target="_blank" style="color: #6366f1;">Open in new tab</a></p>` : ''}
          </div>
          <p style="color: #4b5563;">Please join on time. Good luck! 🍀</p>
        </div>
      </body>
      </html>
    `;

    // Reminder email to Instructor
    const instructorHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">⏰ Interview Reminder</h2>
          <p style="color: #4b5563;">Hi ${instructorName},</p>
          <p style="color: #4b5563;"><strong>Your mock interview with a student starts in 10 minutes!</strong></p>
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin: 4px 0;"><strong>Student Email:</strong> ${studentEmail}</p>
            ${interview.student.profile?.phoneNumber ? `<p style="margin: 4px 0;"><strong>Student Phone:</strong> ${interview.student.profile.phoneNumber}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Time:</strong> ${scheduledTime}</p>
            ${interview.meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link (Teams/Meet):</strong> <a href="${interview.meetingLink}" target="_blank" style="color: #6366f1;">Open in new tab</a></p>` : ''}
          </div>
          <p style="color: #4b5563;">Please be ready on time.</p>
        </div>
      </body>
      </html>
    `;

    // Send reminder to student
    emailService.sendEmail({
      to: studentEmail,
      subject: 'Interview Reminder - 10 Minutes - DataUniverse',
      html: studentHtml,
    }).catch(err => console.error('Failed to send reminder email to student:', err));

    // Send reminder to instructor
    emailService.sendEmail({
      to: instructorEmail,
      subject: 'Interview Reminder - 10 Minutes - DataUniverse',
      html: instructorHtml,
    }).catch(err => console.error('Failed to send reminder email to instructor:', err));
  }

  private sendInterviewFeedbackRequestEmail(interview: InterviewWithRelations) {
    const instructorEmail = interview.instructor.email;
    const instructorName = interview.instructor.profile?.fullName || 'Instructor';
    const studentName = interview.student.profile?.fullName || interview.student.email;
    const scheduledTime = new Date(interview.scheduledAt).toLocaleString('en-IN');
    const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/instructor/interviews?interviewId=${interview.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Interview Completed - Feedback Required</h2>
          <p style="color: #4b5563;">Hi ${instructorName},</p>
          <p style="color: #4b5563;">The mock interview with <strong>${studentName}</strong> has been completed. Please provide your feedback:</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Student:</strong> ${studentName}</p>
            ${interview.student.profile?.phoneNumber ? `<p style="margin: 4px 0;"><strong>Student Phone:</strong> ${interview.student.profile.phoneNumber}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Interview Date:</strong> ${scheduledTime}</p>
            <p style="margin: 4px 0;"><strong>Duration:</strong> ${interview.durationMinutes} minutes</p>
          </div>
          <p style="color: #4b5563;">Click the button below to provide feedback on the interview:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${feedbackUrl}" 
               style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; 
                      border-radius: 8px; text-decoration: none; font-weight: 600;">
              Provide Feedback
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            You can also copy this link:<br>
            <a href="${feedbackUrl}" style="color: #6366f1; word-break: break-all;">${feedbackUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;

    emailService.sendEmail({
      to: instructorEmail,
      subject: 'Interview Feedback Required - DataUniverse',
      html,
    }).catch(err => console.error('Failed to send feedback request email to instructor:', err));
  }

  private sendFeedbackEmail(studentEmail: string, studentName: string | undefined, feedback: InterviewFeedbackShape) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Interview Feedback Available</h2>
          <p style="color: #4b5563;">Hi${studentName ? ` ${studentName}` : ''},</p>
          <p style="color: #4b5563;">Your instructor has submitted feedback for your mock interview.</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Overall Rating:</strong> ${feedback.overallRating}/10</p>
            <p style="margin: 4px 0;"><strong>Communication Skills:</strong> ${feedback.communicationSkills}/10</p>
            <p style="margin: 4px 0;"><strong>Theory Knowledge:</strong> ${feedback.theoryKnowledge}/10</p>
            <p style="margin: 4px 0;"><strong>Practical Knowledge:</strong> ${feedback.practicalKnowledge}/10</p>
            <p style="margin: 4px 0;"><strong>Coding Knowledge:</strong> ${feedback.codingKnowledge}/10</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/interviews" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; 
                    border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View Full Feedback
          </a>
        </div>
      </body>
      </html>
    `;

    emailService.sendEmail({
      to: studentEmail,
      subject: 'Interview Feedback Available - DataUniverse',
      html,
    }).catch(err => console.error('Failed to send feedback email:', err));
  }

  private sendCancellationEmail(interview: InterviewWithRelations) {
    const studentEmail = interview.student.email;
    const studentName = interview.student.profile?.fullName || 'Student';
    const scheduledTime = new Date(interview.scheduledAt).toLocaleString('en-IN');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Interview Cancelled</h2>
          <p style="color: #4b5563;">Hi ${studentName},</p>
          <p style="color: #4b5563;">Your mock interview scheduled for <strong>${scheduledTime}</strong> has been cancelled.</p>
          <p style="color: #4b5563;">A new interview will be scheduled soon. We'll keep you updated.</p>
        </div>
      </body>
      </html>
    `;

    emailService.sendEmail({
      to: studentEmail,
      subject: 'Interview Cancelled - DataUniverse',
      html,
    }).catch(err => console.error('Failed to send cancellation email:', err));
  }
}

export const interviewController = new InterviewController();
