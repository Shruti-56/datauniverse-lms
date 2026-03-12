import { Request, Response } from 'express';
import { s3Service } from '../services/s3.service';
import { prisma } from '../lib/prisma';

class PolicyController {
  /**
   * Get all active policy documents (Public)
   * GET /api/policies
   */
  getPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const policies = await prisma.policyDocument.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      // Generate signed URLs for PDFs
      const policiesWithUrls = await Promise.all(
        policies.map(async (policy) => {
          let signedUrl = policy.pdfUrl;
          if (policy.pdfUrl && !policy.pdfUrl.startsWith('http')) {
            try {
              signedUrl = await s3Service.getDownloadUrl(policy.pdfUrl, 7200);
            } catch (err) {
              console.error('Failed to generate signed URL:', err);
            }
          }
          return {
            ...policy,
            pdfUrl: signedUrl,
          };
        })
      );

      res.json(policiesWithUrls);
    } catch (error: unknown) {
      console.error('Get policies error:', error);
      res.status(500).json({ error: 'Failed to fetch policies' });
    }
  };

  /**
   * Get policy by type (Public)
   * GET /api/policies/:type
   */
  getPolicyByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      const policy = await prisma.policyDocument.findFirst({
        where: {
          type: type.toUpperCase(),
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!policy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }

      // Generate signed URL
      let signedUrl = policy.pdfUrl;
      if (policy.pdfUrl && !policy.pdfUrl.startsWith('http')) {
        try {
          signedUrl = await s3Service.getDownloadUrl(policy.pdfUrl, 7200);
        } catch (err) {
          console.error('Failed to generate signed URL:', err);
        }
      }

      res.json({
        ...policy,
        pdfUrl: signedUrl,
      });
    } catch (error: unknown) {
      console.error('Get policy error:', error);
      res.status(500).json({ error: 'Failed to fetch policy' });
    }
  };

  /**
   * Create/Update policy document (Admin)
   * POST /api/admin/policies
   */
  createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, title, pdfUrl, version } = req.body;

      if (!type || !title || !pdfUrl) {
        res.status(400).json({ error: 'Type, title, and PDF URL are required' });
        return;
      }

      // Deactivate old version of same type
      await prisma.policyDocument.updateMany({
        where: {
          type: type.toUpperCase(),
          isActive: true,
        },
        data: { isActive: false },
      });

      const policy = await prisma.policyDocument.create({
        data: {
          type: type.toUpperCase(),
          title,
          pdfUrl,
          version: version || '1.0',
        },
      });

      res.status(201).json(policy);
    } catch (error: unknown) {
      console.error('Create policy error:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  };

  /**
   * Get upload URL for policy PDF (Admin)
   * POST /api/admin/policies/upload-url
   */
  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, fileType } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json({ error: 'File name and type are required' });
        return;
      }

      const key = `policies/${Date.now()}_${fileName}`;
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

export const policyController = new PolicyController();
