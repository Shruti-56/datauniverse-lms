import { Request, Response } from 'express';
import { emailService } from '../services/email.service';
import { prisma } from '../lib/prisma';

export class ProgressController {
  /**
   * GET /api/progress/course/:courseId
   * Get progress for a specific course
   */
  getCourseProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { courseId } = req.params;

      // Verify enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
      }

      // Get all videos in course (flat list)
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          videos: {
            select: { id: true, title: true, durationMinutes: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const videoProgress = await prisma.videoProgress.findMany({
        where: {
          userId,
          video: { courseId },
        },
      });

      const progressMap = new Map(videoProgress.map(p => [p.videoId, p]));
      const videosWithProgress = course.videos.map(video => ({
        ...video,
        isCompleted: progressMap.get(video.id)?.isCompleted || false,
        watchTimeSeconds: progressMap.get(video.id)?.watchTimeSeconds || 0,
      }));
      const completedVideos = videosWithProgress.filter(v => v.isCompleted).length;
      const totalVideos = course.videos.length;
      const overallProgress = totalVideos > 0
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

      res.json({
        courseId,
        courseTitle: course.title,
        overallProgress,
        totalVideos,
        completedVideos,
        modules: [{
          id: 'course',
          title: 'Content',
          videos: videosWithProgress,
          progress: overallProgress,
          completedCount: completedVideos,
          totalCount: totalVideos,
        }],
      });
    } catch (error) {
      console.error('Get course progress error:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  };

  /**
   * POST /api/progress/video/:videoId/complete
   * Mark a video as completed
   */
  markVideoComplete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { videoId } = req.params;

      // Get video and verify enrollment
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          course: { select: { id: true, title: true } },
        },
      });

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: video.courseId,
          },
        },
      });

      if (!enrollment) {
        res.status(403).json({ error: 'Not enrolled in this course' });
        return;
      }

      // Upsert progress
      const progress = await prisma.videoProgress.upsert({
        where: {
          userId_videoId: { userId, videoId },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          lastWatchedAt: new Date(),
        },
        create: {
          userId,
          videoId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Check if course is now complete
      const courseId = video.courseId;
      const totalVideos = await prisma.video.count({
        where: { courseId },
      });

      const completedVideos = await prisma.videoProgress.count({
        where: {
          userId,
          isCompleted: true,
          video: { courseId },
        },
      });

      // If all videos complete (and course has at least one video), update enrollment and create certificate request
      let courseJustCompleted = false;
      if (totalVideos > 0 && completedVideos === totalVideos) {
        // Check if not already completed
        if (!enrollment.completedAt) {
          courseJustCompleted = true;
          await prisma.enrollment.update({
            where: {
              userId_courseId: { userId, courseId },
            },
            data: { completedAt: new Date() },
          });

          // Create certificate record for admin approval (if not already exists)
          const existingCert = await prisma.courseCertificate.findUnique({
            where: { userId_courseId: { userId, courseId } },
          });
          if (!existingCert) {
            try {
              const year = new Date().getFullYear();
              const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
              const certificateNumber = `CERT-${year}-${suffix}`;
              await prisma.courseCertificate.create({
                data: {
                  userId,
                  courseId,
                  status: 'PENDING_APPROVAL',
                  certificateNumber,
                },
              });
            } catch (certError) {
              console.error('Certificate creation failed (course completed):', certError);
              // Don't fail the request - enrollment is already updated; admin can backfill or retry
            }
          }

          // Send course completion email
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
          });

          if (user) {
            emailService.sendCourseCompletionEmail(
              user.email,
              video.course!.title,
              user.profile?.fullName || undefined
            ).catch(err => console.error('Failed to send completion email:', err));
          }
        }
      }

      res.json({
        progress,
        courseCompleted: completedVideos === totalVideos,
        courseJustCompleted,
        completedVideos,
        totalVideos,
      });
    } catch (error) {
      console.error('Mark video complete error:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  };

  /**
   * POST /api/progress/video/:videoId/progress
   * Update watch progress for a video
   */
  updateWatchProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { videoId } = req.params;
      const { watchTimeSeconds } = req.body;

      if (typeof watchTimeSeconds !== 'number') {
        res.status(400).json({ error: 'watchTimeSeconds is required' });
        return;
      }

      const progress = await prisma.videoProgress.upsert({
        where: {
          userId_videoId: { userId, videoId },
        },
        update: {
          watchTimeSeconds,
          lastWatchedAt: new Date(),
        },
        create: {
          userId,
          videoId,
          watchTimeSeconds,
        },
      });

      res.json(progress);
    } catch (error) {
      console.error('Update watch progress error:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  };

  /**
   * GET /api/progress/overall
   * Get overall learning progress across all courses
   */
  getOverallProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              videos: { select: { id: true } },
            },
          },
        },
      });

      const completedProgress = await prisma.videoProgress.findMany({
        where: {
          userId,
          isCompleted: true,
        },
      });

      const completedVideoIds = new Set(completedProgress.map(p => p.videoId));

      let totalVideos = 0;
      let totalCompleted = 0;

      enrollments.forEach(enrollment => {
        enrollment.course.videos.forEach(video => {
          totalVideos++;
          if (completedVideoIds.has(video.id)) {
            totalCompleted++;
          }
        });
      });

      const completedCourses = enrollments.filter(e => e.completedAt !== null).length;

      res.json({
        enrolledCourses: enrollments.length,
        completedCourses,
        totalVideos,
        completedVideos: totalCompleted,
        overallProgress: totalVideos > 0
          ? Math.round((totalCompleted / totalVideos) * 100)
          : 0,
      });
    } catch (error) {
      console.error('Get overall progress error:', error);
      res.status(500).json({ error: 'Failed to fetch overall progress' });
    }
  };
}
