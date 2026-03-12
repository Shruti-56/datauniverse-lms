import { Router } from 'express';
import { feesController } from '../controllers/fees.controller';
import { authenticate } from '../middleware/auth';
import { requireStudent } from '../middleware/roleGuard';

const router = Router();

// Student: my fees summary and payment history
router.get('/me', authenticate, requireStudent, feesController.getMyFees);

export default router;
