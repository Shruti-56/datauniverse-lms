import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

class AssignmentController {
  /**
   * Create assignment for a video (Admin only)
   * POST /api/admin/assignments
   */
  createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, title, description, instructions, maxScore, dueInDays, isRequired } = req.body;

      if (!videoId || !title || !description) {
        res.status(400).json({ error: 'Video ID, title, and description are required' });
        return;
      }

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      const assignment = await prisma.assignment.create({
        data: {
          videoId,
          title,
          description,
          instructions,
          maxScore: maxScore || 100,
          dueInDays,
          isRequired: isRequired !== false,
        },
        include: {
          video: {
            select: { id: true, title: true },
          },
        },
      });

      res.status(201).json(assignment);
    } catch (error: unknown) {
      console.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  };

  /**
   * Update assignment (Admin only)
   * PUT /api/admin/assignments/:id
   */
  updateAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, instructions, maxScore, dueInDays, isRequired } = req.body;

      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          title,
          description,
          instructions,
          maxScore,
          dueInDays,
          isRequired,
        },
        include: {
          video: {
            select: { id: true, title: true },
          },
        },
      });

      res.json(assignment);
    } catch (error: unknown) {
      console.error('Update assignment error:', error);
      res.status(500).json({ error: 'Failed to update assignment' });
    }
  };

  /**
   * Delete assignment (Admin only)
   * DELETE /api/admin/assignments/:id
   */
  deleteAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.assignment.delete({
        where: { id },
      });

      res.json({ message: 'Assignment deleted successfully' });
    } catch (error: unknown) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  };

  /**
   * Get assignment details (Student)
   * GET /api/assignments/:id
   */
  getAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const assignment = await prisma.assignment.findUnique({
        where: { id },
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

      // Check enrollment
      if (userId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: assignment.video.courseId,
            },
          },
        });

        // Get student's submission if any
        const submission = await prisma.submission.findFirst({
          where: {
            studentId: userId,
            assignmentId: id,
          },
          orderBy: { submittedAt: 'desc' },
        });

        res.json({
          ...assignment,
          isEnrolled: !!enrollment,
          mySubmission: submission,
        });
        return;
      }

      res.json(assignment);
    } catch (error: unknown) {
      console.error('Get assignment error:', error);
      res.status(500).json({ error: 'Failed to fetch assignment' });
    }
  };

  /**
   * Get all assignments for a course (with submission status)
   * GET /api/courses/:courseId/assignments
   */
  getCourseAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      const assignments = await prisma.assignment.findMany({
        where: {
          video: {
            module: { courseId },
          },
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              module: {
                select: { id: true, title: true },
              },
            },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: {
          video: { sortOrder: 'asc' },
        },
      });

      // Get student's submissions if logged in
      const submissionsMap = new Map();
      if (userId) {
        const submissions = await prisma.submission.findMany({
          where: {
            studentId: userId,
            assignmentId: { in: assignments.map(a => a.id) },
          },
          orderBy: { submittedAt: 'desc' },
        });

        // Keep only latest submission per assignment
        submissions.forEach(s => {
          if (!submissionsMap.has(s.assignmentId)) {
            submissionsMap.set(s.assignmentId, s);
          }
        });
      }

      const result = assignments.map(assignment => ({
        ...assignment,
        mySubmission: submissionsMap.get(assignment.id) || null,
      }));

      res.json(result);
    } catch (error: unknown) {
      console.error('Get course assignments error:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  };
}

export const assignmentController = new AssignmentController();
