import { Request, Response } from 'express';
import { s3Service } from '../services/s3.service';
import { prisma } from '../lib/prisma';

class AlumniController {
  /**
   * Get all alumni videos (Admin - all videos)
   * GET /api/admin/alumni/videos
   */
  getAllAlumniVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const videos = await prisma.alumniVideo.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      // Generate signed URLs for videos (if stored in S3)
      const videosWithUrls = await Promise.all(
        videos.map(async (video) => {
          let signedUrl = video.videoUrl;
          // If videoUrl is an S3 key (doesn't start with http), generate signed URL
          if (video.videoUrl && !video.videoUrl.startsWith('http')) {
            try {
              signedUrl = await s3Service.getDownloadUrl(video.videoUrl, 7200);
            } catch (err) {
              console.error('Failed to generate signed URL for video:', video.id, err);
              // Keep original videoUrl if signed URL generation fails
            }
          }
          return {
            ...video,
            videoUrl: signedUrl,
          };
        })
      );

      res.json(videosWithUrls);
    } catch (error: unknown) {
      console.error('Get all alumni videos error:', error);
      res.status(500).json({ error: 'Failed to fetch alumni videos' });
    }
  };

  /**
   * Get all alumni videos (Public - visible only)
   * GET /api/alumni/videos
   */
  getAlumniVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const videos = await prisma.alumniVideo.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
      });

      // Generate signed URLs for videos
      const videosWithUrls = await Promise.all(
        videos.map(async (video) => {
          let signedUrl = video.videoUrl;
          if (video.videoUrl && !video.videoUrl.startsWith('http')) {
            try {
              signedUrl = await s3Service.getDownloadUrl(video.videoUrl, 7200);
            } catch (err) {
              console.error('Failed to generate signed URL:', err);
            }
          }
          return {
            ...video,
            videoUrl: signedUrl,
          };
        })
      );

      res.json(videosWithUrls);
    } catch (error: unknown) {
      console.error('Get alumni videos error:', error);
      res.status(500).json({ error: 'Failed to fetch alumni videos' });
    }
  };

  /**
   * Create alumni video (Admin)
   * POST /api/admin/alumni/videos
   */
  createAlumniVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, studentName, studentRole, company, rating, sortOrder, videoUrl, isVisible } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      if (!videoUrl) {
        res.status(400).json({ error: 'Video URL is required' });
        return;
      }

      const video = await prisma.alumniVideo.create({
        data: {
          title,
          description,
          studentName,
          studentRole,
          company,
          rating: rating ? parseInt(rating) : null,
          sortOrder: sortOrder || 0,
          videoUrl,
          isVisible: isVisible !== undefined ? isVisible : true,
        },
      });

      res.status(201).json(video);
    } catch (error: unknown) {
      console.error('Create alumni video error:', error);
      res.status(500).json({ error: 'Failed to create alumni video' });
    }
  };

  /**
   * Update alumni video (Admin)
   * PUT /api/admin/alumni/videos/:id
   */
  updateAlumniVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, studentName, studentRole, company, rating, sortOrder, isVisible, videoUrl } = req.body;

      const video = await prisma.alumniVideo.update({
        where: { id },
        data: {
          title,
          description,
          studentName,
          studentRole,
          company,
          rating: rating ? parseInt(rating) : null,
          sortOrder,
          isVisible,
          videoUrl,
        },
      });

      res.json(video);
    } catch (error: unknown) {
      console.error('Update alumni video error:', error);
      res.status(500).json({ error: 'Failed to update alumni video' });
    }
  };

  /**
   * Delete alumni video (Admin)
   * DELETE /api/admin/alumni/videos/:id
   */
  deleteAlumniVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const video = await prisma.alumniVideo.findUnique({ where: { id } });
      if (video?.videoUrl && !video.videoUrl.startsWith('http')) {
        // Delete from S3
        try {
          await s3Service.deleteFile(video.videoUrl);
        } catch (err) {
          console.error('Failed to delete video from S3:', err);
        }
      }

      await prisma.alumniVideo.delete({ where: { id } });

      res.json({ message: 'Alumni video deleted successfully' });
    } catch (error: unknown) {
      console.error('Delete alumni video error:', error);
      res.status(500).json({ error: 'Failed to delete alumni video' });
    }
  };

  /**
   * Get upload URL for alumni video (Admin)
   * POST /api/admin/alumni/videos/upload-url
   */
  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, fileType } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json({ error: 'File name and type are required' });
        return;
      }

      const key = `alumni/${Date.now()}_${fileName}`;
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
}

export const alumniController = new AlumniController();
