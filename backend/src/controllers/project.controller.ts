import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

class ProjectController {
  /**
   * Create project for a module (Admin only)
   * POST /api/admin/projects
   */
  createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { moduleId, title, description, instructions, maxScore, dueInDays, isRequired } = req.body;

      if (!moduleId || !title || !description) {
        res.status(400).json({ error: 'Module ID, title, and description are required' });
        return;
      }

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { project: true },
      });

      if (!module) {
        res.status(404).json({ error: 'Module not found' });
        return;
      }

      if (module.project) {
        res.status(400).json({ error: 'This module already has a project' });
        return;
      }

      const project = await prisma.project.create({
        data: {
          moduleId,
          title,
          description,
          instructions,
          maxScore: maxScore || 100,
          dueInDays,
          isRequired: isRequired !== false,
        },
        include: {
          module: {
            select: { id: true, title: true, courseId: true },
          },
        },
      });

      res.status(201).json(project);
    } catch (error: unknown) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  };

  /**
   * Update project (Admin only)
   * PUT /api/admin/projects/:id
   */
  updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, instructions, maxScore, dueInDays, isRequired } = req.body;

      const project = await prisma.project.update({
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
          module: {
            select: { id: true, title: true },
          },
        },
      });

      res.json(project);
    } catch (error: unknown) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  };

  /**
   * Delete project (Admin only)
   * DELETE /api/admin/projects/:id
   */
  deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.project.delete({
        where: { id },
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error: unknown) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  };

  /**
   * Get project details (Student)
   * GET /api/projects/:id
   */
  getProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const project = await prisma.project.findUnique({
        where: { id },
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

      // Check enrollment and get submission
      if (userId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: project.module.courseId,
            },
          },
        });

        const submission = await prisma.submission.findFirst({
          where: {
            studentId: userId,
            projectId: id,
          },
          orderBy: { submittedAt: 'desc' },
        });

        res.json({
          ...project,
          isEnrolled: !!enrollment,
          mySubmission: submission,
        });
        return;
      }

      res.json(project);
    } catch (error: unknown) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  };

  /**
   * Get all projects for a course
   * GET /api/courses/:courseId/projects
   */
  getCourseProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      const projects = await prisma.project.findMany({
        where: {
          module: { courseId },
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              sortOrder: true,
            },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: {
          module: { sortOrder: 'asc' },
        },
      });

      // Get student's submissions
      const submissionsMap = new Map();
      if (userId) {
        const submissions = await prisma.submission.findMany({
          where: {
            studentId: userId,
            projectId: { in: projects.map(p => p.id) },
          },
          orderBy: { submittedAt: 'desc' },
        });

        submissions.forEach(s => {
          if (!submissionsMap.has(s.projectId)) {
            submissionsMap.set(s.projectId, s);
          }
        });
      }

      const result = projects.map(project => ({
        ...project,
        mySubmission: submissionsMap.get(project.id) || null,
      }));

      res.json(result);
    } catch (error: unknown) {
      console.error('Get course projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  };
}

export const projectController = new ProjectController();
