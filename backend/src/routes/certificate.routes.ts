import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Student: list my approved certificates
router.get('/my', requireRoles(UserRole.STUDENT), certificateController.listMy);

// Download PDF: student (own only) or admin (any approved)
router.get('/:id/pdf', certificateController.downloadPdf);

export default router;
