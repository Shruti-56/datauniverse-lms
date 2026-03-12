import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';

const INSTITUTE_NAME = 'DataUniverse';
const INSTITUTE_TAGLINE = 'Learning Platform';
const INSTITUTE_ENDORSEMENT =
  'This certificate is issued by DataUniverse in recognition of excellence in learning and successful completion of the course. DataUniverse is committed to empowering learners with industry-relevant skills and quality education.';

/** Resolve path to certificate logo (DataUniverse logo). Tries backend/assets, then project public. */
function getCertificateLogoPath(): string | null {
  const candidates = [
    process.env.CERTIFICATE_LOGO_PATH,
    path.join(process.cwd(), 'assets', 'certificate-logo.png'),
    path.join(process.cwd(), '..', 'public', 'institute-logo.png'),
    path.join(process.cwd(), '..', 'logo.png'),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Helper: draw centered text in a fixed-width column so all content aligns.
 */
function centeredText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  width: number,
  opts: { fontSize?: number; font?: string; color?: string; lineGap?: number }
): void {
  const { fontSize = 11, font = 'Helvetica', color = '#374151', lineGap = 1 } = opts;
  doc.fontSize(fontSize).font(font).fillColor(color);
  doc.text(text, x, doc.y, { align: 'center', width, lineGap });
}

/**
 * Generate certificate PDF: aligned layout, logo watermark, header, endorsement.
 */
function buildCertificatePdf(options: {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  completedAt: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 56;
    const innerWidth = pageWidth - margin * 2;
    const centerX = pageWidth / 2;
    const contentWidth = innerWidth - 56;
    const contentLeft = centerX - contentWidth / 2;
    const lineLeft = margin + 40;
    const lineRight = pageWidth - margin - 40;
    const innerTop = margin + 14;
    const innerBottom = pageHeight - margin - 14;
    const innerL = margin + 14;
    const innerR = pageWidth - margin - 14;
    const cornerLen = 24;

    // —— Decorative border (double + inner) ——
    doc.lineWidth(2).strokeColor('#1e3a5f').rect(margin - 6, margin - 6, innerWidth + 12, pageHeight - 2 * margin + 12).stroke();
    doc.lineWidth(1).strokeColor('#2d5a87').rect(margin - 2, margin - 2, innerWidth + 4, pageHeight - 2 * margin + 4).stroke();
    doc.lineWidth(0.5).strokeColor('#94a3b8').rect(innerL, innerTop, innerR - innerL, innerBottom - innerTop).stroke();

    // —— Corner accents ——
    doc.lineWidth(1.2).strokeColor('#2d5a87');
    doc.moveTo(innerL, innerTop + cornerLen).lineTo(innerL, innerTop).lineTo(innerL + cornerLen, innerTop).stroke();
    doc.moveTo(innerR - cornerLen, innerTop).lineTo(innerR, innerTop).lineTo(innerR, innerTop + cornerLen).stroke();
    doc.moveTo(innerR, innerBottom - cornerLen).lineTo(innerR, innerBottom).lineTo(innerR - cornerLen, innerBottom).stroke();
    doc.moveTo(innerL + cornerLen, innerBottom).lineTo(innerL, innerBottom).lineTo(innerL, innerBottom - cornerLen).stroke();

    // —— Background watermark ——
    const logoPath = getCertificateLogoPath();
    if (logoPath) {
      try {
        doc.opacity(0.1);
        const wmSize = 260;
        doc.image(logoPath, centerX - wmSize / 2, pageHeight / 2 - wmSize / 2 - 16, { width: wmSize, height: wmSize });
        doc.opacity(1);
      } catch {
        doc.opacity(1);
      }
    }

    let y = margin + 28;

    // —— Header: logo + institute name ——
    if (logoPath) {
      try {
        const logoSize = 48;
        doc.image(logoPath, centerX - logoSize / 2, y, { width: logoSize, height: logoSize });
        y += logoSize + 10;
      } catch {
        y += 6;
      }
    }
    doc.y = y;
    centeredText(doc, INSTITUTE_NAME, contentLeft, contentWidth, { fontSize: 20, font: 'Helvetica-Bold', color: '#1e3a5f' });
    doc.moveDown(0.15);
    centeredText(doc, INSTITUTE_TAGLINE, contentLeft, contentWidth, { fontSize: 10, color: '#4a6fa5' });
    y = doc.y + 14;

    // —— Decorative line ——
    doc.strokeColor('#2d5a87').lineWidth(0.8).moveTo(lineLeft, y).lineTo(lineRight, y).stroke();
    y += 20;

    // —— Certificate title ——
    doc.y = y;
    centeredText(doc, 'Certificate of Completion', contentLeft, contentWidth, { fontSize: 28, font: 'Helvetica-Bold', color: '#1e3a5f' });
    doc.moveDown(0.5);
    centeredText(doc, 'This is to certify that', contentLeft, contentWidth, { fontSize: 12, color: '#475569' });
    y = doc.y + 22;

    // —— Student name ——
    doc.y = y;
    centeredText(doc, options.studentName, contentLeft, contentWidth, { fontSize: 26, font: 'Helvetica-Bold', color: '#0f172a', lineGap: 2 });
    doc.moveDown(0.4);
    centeredText(doc, 'has successfully completed the course', contentLeft, contentWidth, { fontSize: 12, color: '#475569' });
    y = doc.y + 20;

    // —— Course title box (centered) ——
    const boxW = contentWidth + 16;
    const boxH = 44;
    const boxLeft = centerX - boxW / 2;
    doc.rect(boxLeft, y, boxW, boxH).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.y = y + 14;
    centeredText(doc, options.courseTitle, contentLeft, contentWidth, { fontSize: 16, font: 'Helvetica-Bold', color: '#1e3a5f' });
    y = y + boxH + 18;

    // —— Date and cert number ——
    doc.y = y;
    centeredText(doc, `Completed on ${options.completedAt}`, contentLeft, contentWidth, { fontSize: 11, color: '#64748b' });
    doc.moveDown(0.35);
    centeredText(doc, `Certificate No. ${options.certificateNumber}`, contentLeft, contentWidth, { fontSize: 9, color: '#94a3b8' });
    y = doc.y + 22;

    // —— Decorative line ——
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(lineLeft, y).lineTo(lineRight, y).stroke();
    y += 20;

    // —— Endorsement paragraph (centered, fixed width) ——
    doc.y = y;
    doc.fontSize(9).font('Helvetica').fillColor('#475569');
    doc.text(INSTITUTE_ENDORSEMENT, contentLeft, doc.y, { align: 'center', width: contentWidth, lineGap: 3 });
    y = doc.y + 22;

    // —— Authorized block ——
    const authLineW = 100;
    doc.strokeColor('#2d5a87').lineWidth(0.6).moveTo(centerX - authLineW, y).lineTo(centerX + authLineW, y).stroke();
    y += 16;
    doc.y = y;
    centeredText(doc, 'Authorized by', contentLeft, contentWidth, { fontSize: 8, color: '#94a3b8' });
    doc.moveDown(0.4);
    centeredText(doc, INSTITUTE_NAME, contentLeft, contentWidth, { fontSize: 14, font: 'Helvetica-Bold', color: '#1e3a5f' });
    doc.moveDown(0.15);
    centeredText(doc, 'Learning Platform', contentLeft, contentWidth, { fontSize: 10, color: '#4a6fa5' });

    // —— Footer logo ——
    if (logoPath) {
      try {
        const footY = pageHeight - margin - 48;
        doc.image(logoPath, centerX - 24, footY, { width: 48, height: 48 });
      } catch {
        // ignore
      }
    }

    doc.end();
  });
}

/** Generate a unique certificate number. */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `CERT-${year}-${suffix}`;
}

export class CertificateController {
  /**
   * GET /api/admin/certificates
   * List all certificates (admin). Query: ?status=PENDING_APPROVAL|APPROVED|REJECTED
   * Backfills: creates PENDING_APPROVAL certificates for any completed enrollment that has none.
   */
  listForAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      // Backfill: create certificate requests for completed enrollments that don't have one
      try {
        const completedEnrollments = await prisma.enrollment.findMany({
          where: { completedAt: { not: null } },
          select: { userId: true, courseId: true },
        });
        for (const en of completedEnrollments) {
          const existing = await prisma.courseCertificate.findUnique({
            where: { userId_courseId: { userId: en.userId, courseId: en.courseId } },
          });
          if (!existing) {
            await prisma.courseCertificate.create({
              data: {
                userId: en.userId,
                courseId: en.courseId,
                status: 'PENDING_APPROVAL',
                certificateNumber: generateCertificateNumber(),
              },
            });
          }
        }
      } catch (backfillErr) {
        console.error('Certificate backfill error (non-fatal):', backfillErr);
      }

      const status = req.query.status as string | undefined;
      const where: { status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' } = {};
      if (status && ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(status)) {
        where.status = status as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
      }
      const certificates = await prisma.courseCertificate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          course: { select: { id: true, title: true } },
          approvedBy: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(certificates);
    } catch (error: unknown) {
      console.error('List certificates (admin) error:', error);
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  };

  /**
   * POST /api/admin/certificates/:id/approve
   * Admin approves a certificate.
   */
  approve = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const cert = await prisma.courseCertificate.findUnique({ where: { id } });
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      if (cert.status !== 'PENDING_APPROVAL') {
        res.status(400).json({ error: 'Certificate is not pending approval' });
        return;
      }
      await prisma.courseCertificate.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedById: adminId ?? undefined },
      });
      res.json({ message: 'Certificate approved', id });
    } catch (error: unknown) {
      console.error('Approve certificate error:', error);
      res.status(500).json({ error: 'Failed to approve certificate' });
    }
  };

  /**
   * POST /api/admin/certificates/:id/reject
   * Admin rejects a certificate.
   */
  reject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cert = await prisma.courseCertificate.findUnique({ where: { id } });
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      if (cert.status !== 'PENDING_APPROVAL') {
        res.status(400).json({ error: 'Certificate is not pending approval' });
        return;
      }
      await prisma.courseCertificate.update({
        where: { id },
        data: { status: 'REJECTED', rejectedAt: new Date() },
      });
      res.json({ message: 'Certificate rejected', id });
    } catch (error: unknown) {
      console.error('Reject certificate error:', error);
      res.status(500).json({ error: 'Failed to reject certificate' });
    }
  };

  /**
   * GET /api/certificates/my
   * Student: list my approved certificates only. Backfills pending cert requests for completed courses.
   */
  listMy = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      // Backfill for this student: create PENDING_APPROVAL cert for any completed enrollment without one
      try {
        const completedEnrollments = await prisma.enrollment.findMany({
          where: { userId, completedAt: { not: null } },
          select: { courseId: true },
        });
        for (const en of completedEnrollments) {
          const existing = await prisma.courseCertificate.findUnique({
            where: { userId_courseId: { userId, courseId: en.courseId } },
          });
          if (!existing) {
            await prisma.courseCertificate.create({
              data: {
                userId,
                courseId: en.courseId,
                status: 'PENDING_APPROVAL',
                certificateNumber: generateCertificateNumber(),
              },
            });
          }
        }
      } catch (backfillErr) {
        console.error('Certificate backfill (my) error (non-fatal):', backfillErr);
      }

      const certificates = await prisma.courseCertificate.findMany({
        where: { userId, status: 'APPROVED' },
        include: {
          course: { select: { id: true, title: true } },
        },
        orderBy: { approvedAt: 'desc' },
      });
      res.json(certificates);
    } catch (error: unknown) {
      console.error('List my certificates error:', error);
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  };

  /**
   * GET /api/certificates/:id/pdf
   * Download certificate as PDF. Student: own only; Admin: any approved.
   */
  downloadPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.roles?.[0];
      const cert = await prisma.courseCertificate.findUnique({
        where: { id },
        include: {
          user: { include: { profile: true } },
          course: { select: { title: true } },
        },
      });
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      if (cert.status !== 'APPROVED') {
        res.status(403).json({ error: 'Certificate is not approved for download' });
        return;
      }
      const isAdmin = userRole === UserRole.ADMIN;
      const isOwner = cert.userId === userId;
      if (!isAdmin && !isOwner) {
        res.status(403).json({ error: 'Not authorized to download this certificate' });
        return;
      }
      const studentName = cert.user.profile?.fullName || cert.user.email;
      const completedAt = cert.approvedAt
        ? cert.approvedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : cert.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const pdfBuffer = await buildCertificatePdf({
        studentName,
        courseTitle: cert.course.title,
        certificateNumber: cert.certificateNumber,
        completedAt,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificate-${cert.certificateNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: unknown) {
      console.error('Download certificate PDF error:', error);
      res.status(500).json({ error: 'Failed to generate certificate PDF' });
    }
  };
}

export const certificateController = new CertificateController();
