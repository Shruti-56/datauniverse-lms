import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class ScreenTimeController {
  /**
   * POST /api/screentime/ping
   * Record a heartbeat to track screen time (called every 30 seconds from frontend)
   */
  recordPing = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const userId = req.user.id;
      
      // Create date at midnight UTC for consistent storage
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Upsert screen time record for today
      const screenTime = await prisma.screenTime.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          totalSeconds: { increment: 60 }, // Add 60 seconds per ping (matches 60s frontend interval)
          lastPing: new Date(),
        },
        create: {
          userId,
          date: today,
          totalSeconds: 60,
          lastPing: new Date(),
        },
      });

      res.json({ success: true, totalSeconds: screenTime.totalSeconds });
    } catch (error: unknown) {
      console.error('Screen time ping error:', error);
      res.status(500).json({ error: 'Failed to record screen time' });
    }
  };

  /**
   * GET /api/screentime/my
   * Get current user's screen time for today and this week
   */
  getMyScreenTime = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const userId = req.user.id;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const screenTimeData = await prisma.screenTime.findMany({
        where: {
          userId,
          date: { gte: weekAgo },
        },
        orderBy: { date: 'desc' },
      });

      const todayStr = today.toISOString().split('T')[0];
      const todayData = screenTimeData.find((st) => {
        const stDateStr = new Date(st.date).toISOString().split('T')[0];
        return stDateStr === todayStr;
      });

      const weeklyTotal = screenTimeData.reduce(
        (sum, st) => sum + st.totalSeconds,
        0
      );

      res.json({
        today: todayData?.totalSeconds || 0,
        weekly: weeklyTotal,
        dailyBreakdown: screenTimeData,
      });
    } catch (error: unknown) {
      console.error('Get screen time error:', error);
      res.status(500).json({ error: 'Failed to get screen time' });
    }
  };
}

export const screenTimeController = new ScreenTimeController();
