import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';

function toNum(d: Decimal | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'object' && 'toNumber' in d ? (d as Decimal).toNumber() : Number(d);
}

export const feesController = {
  // Admin: list all students with fees summary (total, paid, remaining)
  listFees: async (req: Request, res: Response): Promise<void> => {
    try {
      const students = await prisma.user.findMany({
        where: { role: UserRole.STUDENT },
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
          feesRecord: true,
          feesPayments: { select: { amount: true } },
        },
        orderBy: { email: 'asc' },
      });

      const list = students.map((s) => {
        const total = toNum(s.feesRecord?.totalAmount);
        const paid = s.feesPayments.reduce((sum, p) => sum + toNum(p.amount), 0);
        return {
          id: s.id,
          email: s.email,
          fullName: s.profile?.fullName ?? null,
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: Math.max(0, total - paid),
        };
      });
      res.json(list);
    } catch (error: unknown) {
      console.error('List fees error:', error);
      res.status(500).json({ error: 'Failed to fetch fees' });
    }
  },

  // Admin: set total fees for a student
  setTotalFees: async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { totalAmount } = req.body;
      if (totalAmount == null || Number(totalAmount) < 0) {
        res.status(400).json({ error: 'Valid totalAmount is required' });
        return;
      }
      const amount = Number(totalAmount);

      const student = await prisma.user.findFirst({
        where: { id: studentId, role: UserRole.STUDENT },
      });
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const record = await prisma.studentFees.upsert({
        where: { studentId },
        create: { studentId, totalAmount: amount },
        update: { totalAmount: amount },
      });
      res.json(record);
    } catch (error: unknown) {
      console.error('Set total fees error:', error);
      res.status(500).json({ error: 'Failed to set fees' });
    }
  },

  // Admin: add a cash payment
  addPayment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { amount, note } = req.body;
      const userId = req.user?.id;

      if (amount == null || Number(amount) <= 0) {
        res.status(400).json({ error: 'Valid amount is required' });
        return;
      }

      const student = await prisma.user.findFirst({
        where: { id: studentId, role: UserRole.STUDENT },
      });
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const payment = await prisma.feesPayment.create({
        data: {
          studentId,
          amount: Number(amount),
          method: 'CASH',
          note: note?.trim() || null,
          recordedBy: userId,
        },
      });
      res.status(201).json(payment);
    } catch (error: unknown) {
      console.error('Add payment error:', error);
      res.status(500).json({ error: 'Failed to add payment' });
    }
  },

  // Admin: list payments for a student
  listPayments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const payments = await prisma.feesPayment.findMany({
        where: { studentId },
        orderBy: { paidAt: 'desc' },
      });
      const student = await prisma.user.findFirst({
        where: { id: studentId, role: UserRole.STUDENT },
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
          feesRecord: true,
        },
      });
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
      const total = toNum(student.feesRecord?.totalAmount);
      const paid = payments.reduce((sum, p) => sum + toNum(p.amount), 0);
      res.json({
        student: {
          id: student.id,
          email: student.email,
          fullName: student.profile?.fullName ?? null,
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: Math.max(0, total - paid),
        },
        payments,
      });
    } catch (error: unknown) {
      console.error('List payments error:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  },

  // Student: get my fees summary
  getMyFees: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const record = await prisma.studentFees.findUnique({
        where: { studentId: userId },
      });
      const payments = await prisma.feesPayment.findMany({
        where: { studentId: userId },
        orderBy: { paidAt: 'desc' },
      });
      const total = toNum(record?.totalAmount);
      const paid = payments.reduce((sum, p) => sum + toNum(p.amount), 0);
      res.json({
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: Math.max(0, total - paid),
        payments,
      });
    } catch (error: unknown) {
      console.error('Get my fees error:', error);
      res.status(500).json({ error: 'Failed to fetch fees' });
    }
  },
};
