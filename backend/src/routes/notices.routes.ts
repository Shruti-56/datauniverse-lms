import { Router } from 'express';
import { noticeController } from '../controllers/notice.controller';
import { authenticate } from '../middleware/auth';
import { requireStudent } from '../middleware/roleGuard';

const router = Router();

// Student: list my notices (for dashboard)
router.get('/', authenticate, requireStudent, noticeController.listMy);
// Student: acknowledge (dismiss or remind later)
router.post('/:id/acknowledge', authenticate, requireStudent, noticeController.acknowledge);

export default router;
