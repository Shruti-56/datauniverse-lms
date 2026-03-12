import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const promoBannerController = {
  // Public: list active banners for student dashboard (no auth)
  listPublic: async (_req: Request, res: Response): Promise<void> => {
    try {
      const banners = await prisma.promoBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          badge: true,
          ctaText: true,
          ctaLink: true,
          gradient: true,
        },
      });
      res.json(banners);
    } catch (error: unknown) {
      console.error('List promo banners (public) error:', error);
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  },

  // Admin: list all banners
  list: async (_req: Request, res: Response): Promise<void> => {
    try {
      const banners = await prisma.promoBanner.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      res.json(banners);
    } catch (error: unknown) {
      console.error('List promo banners error:', error);
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  },

  // Admin: create banner
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, subtitle, badge, ctaText, ctaLink, gradient, sortOrder, isActive } = req.body;
      if (!title?.trim()) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }
      const order = typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder), 10);
      const banner = await prisma.promoBanner.create({
        data: {
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          badge: badge?.trim() || null,
          ctaText: ctaText?.trim() || 'Explore',
          ctaLink: ctaLink?.trim() || '/student/marketplace',
          gradient: gradient?.trim() || 'from-violet-600 via-purple-600 to-indigo-700',
          sortOrder: Number.isFinite(order) ? order : 0,
          isActive: isActive !== false,
        },
      });
      res.status(201).json(banner);
    } catch (error: unknown) {
      console.error('Create promo banner error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create banner';
      res.status(500).json({
        error: 'Failed to create banner',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  },

  // Admin: update banner
  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, subtitle, badge, ctaText, ctaLink, gradient, sortOrder, isActive } = req.body;
      const data: {
        title?: string;
        subtitle?: string | null;
        badge?: string | null;
        ctaText?: string;
        ctaLink?: string;
        gradient?: string;
        sortOrder?: number;
        isActive?: boolean;
      } = {};
      if (title !== undefined) data.title = title.trim();
      if (subtitle !== undefined) data.subtitle = subtitle?.trim() || null;
      if (badge !== undefined) data.badge = badge?.trim() || null;
      if (ctaText !== undefined) data.ctaText = ctaText?.trim() || 'Explore';
      if (ctaLink !== undefined) data.ctaLink = ctaLink?.trim() || '/student/marketplace';
      if (gradient !== undefined) data.gradient = gradient?.trim() || 'from-violet-600 via-purple-600 to-indigo-700';
      if (typeof sortOrder === 'number') data.sortOrder = sortOrder;
      if (typeof isActive === 'boolean') data.isActive = isActive;

      const banner = await prisma.promoBanner.update({
        where: { id },
        data,
      });
      res.json(banner);
    } catch (error: unknown) {
      console.error('Update promo banner error:', error);
      res.status(500).json({ error: 'Failed to update banner' });
    }
  },

  // Admin: delete banner
  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.promoBanner.delete({ where: { id } });
      res.json({ message: 'Banner deleted' });
    } catch (error: unknown) {
      console.error('Delete promo banner error:', error);
      res.status(500).json({ error: 'Failed to delete banner' });
    }
  },
};
