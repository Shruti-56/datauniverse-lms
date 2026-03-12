import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * POST /api/feedback
 * Student submits feedback to the institute
 */
export const feedbackController = {
  submit: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { message, category, rating } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      const categoryStr = category && String(category).trim() ? String(category).trim() : null;
      const ratingNum =
        rating != null && !Number.isNaN(Number(rating))
          ? Math.min(5, Math.max(1, Math.round(Number(rating))))
          : null;

      const feedback = await prisma.studentFeedback.create({
        data: {
          userId,
          message: message.trim(),
          category: categoryStr,
          rating: ratingNum,
        },
      });
      res.status(201).json({ message: 'Thank you for your feedback', feedback: { id: feedback.id, createdAt: feedback.createdAt } });
    } catch (error: unknown) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  },
};
