import { Request, Response } from 'express';
import { EnrollmentSource, UserRole } from '@prisma/client';
import { emailService } from '../services/email.service';
import { prisma } from '../lib/prisma';

class EnrollmentController {
  /**
   * Enroll in course (Student - for free courses or after payment)
   * POST /api/enrollments
   */
  enrollInCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { courseId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!courseId) {
        res.status(400).json({ error: 'Course ID is required' });
        return;
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (existing) {
        res.status(400).json({ error: 'Already enrolled in this course' });
        return;
      }

      // Get course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      // Check if course is free
      const isFree = parseFloat(course.price.toString()) === 0;

      if (!isFree) {
        res.status(400).json({ error: 'Course requires payment' });
        return;
      }

      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          source: EnrollmentSource.FREE,
        },
        include: {
          course: true,
          user: {
            include: { profile: true },
          },
        },
      });

      // Send enrollment email
      const user = enrollment.user;
      if (user) {
        emailService.sendEnrollmentEmail(
          user.email,
          course.title,
          user.profile?.fullName || undefined
        ).catch(err => console.error('Failed to send enrollment email:', err));
      }

      res.status(201).json({
        message: 'Enrolled successfully',
        enrollment,
      });
    } catch (error: unknown) {
      console.error('Enroll in course error:', error);
      res.status(500).json({ error: 'Failed to enroll in course' });
    }
  };

  /**
   * Admin grants course access to student (free enrollment)
   * POST /api/admin/enrollments
   */
  grantEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      const { studentId, courseId } = req.body;

      if (!studentId || !courseId) {
        res.status(400).json({ error: 'Student ID and Course ID are required' });
        return;
      }

      // Verify student exists
      const student = await prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student || student.role !== UserRole.STUDENT) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: studentId, courseId },
        },
      });

      if (existing) {
        res.status(400).json({ error: 'Student is already enrolled in this course' });
        return;
      }

      // Get course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      // Create enrollment with admin grant
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: studentId,
          courseId,
          source: EnrollmentSource.ADMIN_GRANTED,
          grantedBy: adminId || null,
        },
        include: {
          course: true,
          user: {
            include: { profile: true },
          },
        },
      });

      // Send enrollment email
      const user = enrollment.user;
      if (user) {
        emailService.sendEnrollmentEmail(
          user.email,
          course.title,
          user.profile?.fullName || undefined
        ).catch(err => console.error('Failed to send enrollment email:', err));
      }

      res.status(201).json({
        message: 'Course access granted successfully',
        enrollment,
      });
    } catch (error: unknown) {
      console.error('Grant enrollment error:', error);
      res.status(500).json({ error: 'Failed to grant enrollment' });
    }
  };

  /**
   * Get my enrollments (Student)
   * GET /api/enrollments
   */
  getMyEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  videos: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      res.json(enrollments);
    } catch (error: unknown) {
      console.error('Get enrollments error:', error);
      res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
  };
}

export const enrollmentController = new EnrollmentController();
