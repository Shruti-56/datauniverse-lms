import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth';
import { requireStudent } from '../middleware/roleGuard';

const router = Router();

router.post('/', authenticate, requireStudent, feedbackController.submit);

export default router;
