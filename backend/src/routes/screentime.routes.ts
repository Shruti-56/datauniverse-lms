import { Router } from 'express';
import { screenTimeController } from '../controllers/screentime.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Record ping (heartbeat)
router.post('/ping', screenTimeController.recordPing);

// Get my screen time
router.get('/my', screenTimeController.getMyScreenTime);

export default router;
