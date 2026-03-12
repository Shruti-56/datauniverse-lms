import { Request, Response } from 'express';
import { SubmissionStatus } from '@prisma/client';
import { emailService } from '../services/email.service';
import { s3Service } from '../services/s3.service';
import { prisma } from '../lib/prisma';

class SubmissionController {
  /**
   * Submit assignment
   * POST /api/submissions/assignment/:assignmentId
   */
  submitAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { assignmentId } = req.params;
      const { content, fileUrl, fileName } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!content && !fileUrl) {
        res.status(400).json({ error: 'Please provide content or file' });
        return;
      }

      // Get assignment and verify enrollment
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          video: {
            include: {
              course: { select: { id: true, title: true } },
            },
          },
        },
      });

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (!assignment.video) {
        res.status(404).json({ error: 'Assignment video not found' });
        return;
      }

      const courseId = assignment.video.courseId;
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          studentId: userId,
          assignmentId,
          content,
          fileUrl,
          fileName,
          status: SubmissionStatus.PENDING,
        },
        include: {
          student: {
            select: {
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });

      // Get student's assigned instructor
      const studentInstructor = await prisma.studentInstructor.findFirst({
        where: { studentId: userId },
        include: {
          instructor: {
            include: { profile: true },
          },
        },
      });

      // Notify instructor via email (only if student has an assigned instructor)
      if (studentInstructor?.instructor) {
        const studentProfile = await prisma.profile.findUnique({
          where: { userId: submission.studentId },
          select: { phoneNumber: true },
        });
        await this.notifyInstructor(
          studentInstructor.instructor.email,
          studentInstructor.instructor.profile?.fullName || 'Instructor',
          submission.student.profile?.fullName || submission.student.email,
          studentProfile?.phoneNumber ?? undefined,
          'assignment',
          assignment.title,
          assignment.video?.course?.title || 'Unknown Course',
          submission.id
        );
      } else {
        console.warn(
          '📧 Instructor notification skipped: student has no assigned instructor. Assign an instructor in Admin → Students so the instructor receives submission emails.'
        );
      }

      res.status(201).json({
        message: 'Assignment submitted successfully',
        submission,
      });
    } catch (error: unknown) {
      console.error('Submit assignment error:', error);
      res.status(500).json({ error: 'Failed to submit assignment' });
    }
  };

  /**
   * Submit project
   * POST /api/submissions/project/:projectId
   */
  submitProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { projectId } = req.params;
      const { content, fileUrl, fileName } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!content && !fileUrl) {
        res.status(400).json({ error: 'Please provide content or file' });
        return;
      }

      // Get project and verify enrollment
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (!project.module || !project.module.course) {
        res.status(404).json({ error: 'Project module or course not found' });
        return;
      }

      const courseId = project.module.courseId;
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          studentId: userId,
          projectId,
          content,
          fileUrl,
          fileName,
          status: SubmissionStatus.PENDING,
        },
        include: {
          student: {
            select: {
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      });

      // Get student's assigned instructor
      const studentInstructor = await prisma.studentInstructor.findFirst({
        where: { studentId: userId },
        include: {
          instructor: {
            include: { profile: true },
          },
        },
      });

      // Notify instructor via email (only if student has an assigned instructor)
      if (studentInstructor?.instructor) {
        const studentProfile = await prisma.profile.findUnique({
          where: { userId: submission.studentId },
          select: { phoneNumber: true },
        });
        await this.notifyInstructor(
          studentInstructor.instructor.email,
          studentInstructor.instructor.profile?.fullName || 'Instructor',
          submission.student.profile?.fullName || submission.student.email,
          studentProfile?.phoneNumber ?? undefined,
          'project',
          project.title,
          project.module?.course?.title || 'Unknown Course',
          submission.id
        );
      } else {
        console.warn(
          '📧 Instructor notification skipped: student has no assigned instructor. Assign an instructor in Admin → Students so the instructor receives submission emails.'
        );
      }

      res.status(201).json({
        message: 'Project submitted successfully',
        submission,
      });
    } catch (error: unknown) {
      console.error('Submit project error:', error);
      res.status(500).json({ error: 'Failed to submit project' });
    }
  };

  /**
   * Get upload URL for submission file
   * POST /api/submissions/upload-url
   */
  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { fileName, fileType } = req.body;

      if (!userId || !fileName || !fileType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const key = `submissions/${userId}/${Date.now()}_${fileName}`;
      const uploadUrl = await s3Service.getUploadUrl(key, fileType);

      res.json({
        uploadUrl,
        fileUrl: key,
        fileName,
      });
    } catch (error: unknown) {
      console.error('Get upload URL error:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  };

  /**
   * Get my submissions (Student)
   * GET /api/submissions/my
   */
  getMySubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const submissions = await prisma.submission.findMany({
        where: { studentId: userId },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              video: {
                select: {
                  title: true,
                  course: { select: { title: true } },
                  module: { select: { title: true } },
                },
              },
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              module: {
                select: { title: true, course: { select: { title: true } } },
              },
            },
          },
          reviewer: {
            select: {
              profile: { select: { fullName: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.json(submissions);
    } catch (error: unknown) {
      console.error('Get my submissions error:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  };

  /**
   * Get submissions for review (Instructor)
   * GET /api/submissions/review
   */
  getSubmissionsForReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get students assigned to this instructor
      const studentAssignments = await prisma.studentInstructor.findMany({
        where: { instructorId: userId },
        select: { studentId: true },
      });

      const studentIds = studentAssignments.map(sa => sa.studentId);

      if (studentIds.length === 0) {
        res.json([]);
        return;
      }

      // Get submissions from assigned students
      const whereClause: Record<string, unknown> = {
        studentId: { in: studentIds },
      };

      if (status) {
        whereClause.status = status as SubmissionStatus;
      }

      const submissions = await prisma.submission.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          assignment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              video: {
                select: { title: true },
              },
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              maxScore: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.json(submissions);
    } catch (error: unknown) {
      console.error('Get submissions for review error:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  };

  /**
   * Get download URL for submission file
   * GET /api/submissions/:id/download-url
   */
  getSubmissionDownloadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get submission
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          student: true,
        },
      });

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check if user is authorized (instructor assigned to student, or student themselves)
      if (submission.studentId === userId) {
        // Student can download their own submission
      } else {
        // Check if instructor is assigned to this student
        const studentInstructor = await prisma.studentInstructor.findFirst({
          where: {
            studentId: submission.studentId,
            instructorId: userId,
          },
        });

        if (!studentInstructor) {
          res.status(403).json({ error: 'Not authorized to access this file' });
          return;
        }
      }

      if (!submission.fileUrl) {
        res.status(404).json({ error: 'No file attached to this submission' });
        return;
      }

      // Generate signed URL for file download
      try {
        const downloadUrl = await s3Service.getDownloadUrl(submission.fileUrl, 3600); // 1 hour expiry
        res.json({ downloadUrl, fileName: submission.fileName });
      } catch (error: unknown) {
        console.error('Failed to generate download URL:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
      }
    } catch (error: unknown) {
      console.error('Get submission download URL error:', error);
      res.status(500).json({ error: 'Failed to get download URL' });
    }
  };

  /**
   * Review/Grade submission (Instructor)
   * PUT /api/submissions/:id/review
   */
  reviewSubmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { status, score, feedback } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      // Get submission
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          assignment: {
            include: {
              video: {
                include: {
                  module: true,
                },
              },
            },
          },
          project: {
            include: {
              module: true,
            },
          },
          student: {
            include: { profile: true },
          },
        },
      });

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Verify instructor is assigned to this student
      const studentInstructor = await prisma.studentInstructor.findFirst({
        where: {
          studentId: submission.studentId,
          instructorId: userId,
        },
      });

      if (!studentInstructor) {
        res.status(403).json({ error: 'Not authorized to review this submission' });
        return;
      }

      // Update submission
      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status: status as SubmissionStatus,
          score,
          feedback,
          reviewerId: userId,
          reviewedAt: new Date(),
        },
      });

      // Notify student about review
      const studentEmail = submission.student.email;
      const studentName = submission.student.profile?.fullName;
      const itemTitle = submission.assignment?.title || submission.project?.title || 'Submission';

      await this.notifyStudentReview(studentEmail, studentName, itemTitle, status, score, feedback);

      res.json({
        message: 'Submission reviewed successfully',
        submission: updated,
      });
    } catch (error: unknown) {
      console.error('Review submission error:', error);
      res.status(500).json({ error: 'Failed to review submission' });
    }
  };

  /**
   * Notify instructor about new submission
   */
  private async notifyInstructor(
    email: string,
    instructorName: string,
    studentName: string,
    studentPhone: string | undefined,
    type: 'assignment' | 'project',
    title: string,
    courseName: string,
    submissionId: string
  ): Promise<void> {
    const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/instructor/submissions?submissionId=${submissionId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">New ${type === 'assignment' ? 'Assignment' : 'Project'} Submission</h2>
          <p style="color: #4b5563;">Hi ${instructorName},</p>
          <p style="color: #4b5563;">A student has submitted their work for review:</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Student:</strong> ${studentName}</p>
            ${studentPhone ? `<p style="margin: 4px 0;"><strong>Student Phone:</strong> ${studentPhone}</p>` : ''}
            <p style="margin: 4px 0;"><strong>${type === 'assignment' ? 'Assignment' : 'Project'}:</strong> ${title}</p>
            <p style="margin: 4px 0;"><strong>Course:</strong> ${courseName}</p>
          </div>
          <p style="color: #4b5563;">Click the button below to review and provide feedback:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${reviewUrl}" 
               style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; 
                      border-radius: 8px; text-decoration: none; font-weight: 600;">
              Review & Provide Feedback
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            You can also copy this link:<br>
            <a href="${reviewUrl}" style="color: #6366f1; word-break: break-all;">${reviewUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      const sent = await emailService.sendEmail({
        to: email,
        subject: `New ${type} submission: ${title}`,
        html,
      });
      if (!sent) console.error('Failed to send instructor notification to', email);
    } catch (err) {
      console.error('Failed to notify instructor:', err);
    }
  }

  /**
   * Notify student about review
   */
  private async notifyStudentReview(
    email: string,
    studentName: string | undefined,
    title: string,
    status: string,
    score: number | undefined,
    feedback: string | undefined
  ): Promise<void> {
    const statusText = status === 'APPROVED' ? '✅ Approved' : 
                       status === 'REJECTED' ? '❌ Needs Improvement' : 
                       status === 'RESUBMIT' ? '🔄 Resubmission Required' : status;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
          <h1 style="color: #6366f1; margin: 0 0 24px;">🎓 DataUniverse</h1>
          <h2 style="color: #1f2937;">Your Submission Has Been Reviewed</h2>
          <p style="color: #4b5563;">Hi${studentName ? ` ${studentName}` : ''},</p>
          <p style="color: #4b5563;">Your submission for <strong>${title}</strong> has been reviewed.</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Status:</strong> ${statusText}</p>
            ${score !== undefined ? `<p style="margin: 4px 0;"><strong>Score:</strong> ${score}/100</p>` : ''}
          </div>
          ${feedback ? `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Feedback:</strong></p>
              <p style="margin: 8px 0 0; color: #92400e;">${feedback}</p>
            </div>
          ` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/submissions" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; 
                    border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View Details
          </a>
        </div>
      </body>
      </html>
    `;

    try {
      const sent = await emailService.sendEmail({
        to: email,
        subject: `Submission Reviewed: ${title}`,
        html,
      });
      if (!sent) console.error('Failed to send review notification to student', email);
    } catch (err) {
      console.error('Failed to notify student:', err);
    }
  }
}

export const submissionController = new SubmissionController();
