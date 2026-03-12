import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const progressController = new ProgressController();

// All routes require authentication
router.use(authenticate);

router.get('/course/:courseId', progressController.getCourseProgress);
router.post('/video/:videoId/complete', progressController.markVideoComplete);
router.post('/video/:videoId/progress', progressController.updateWatchProgress);
router.get('/overall', progressController.getOverallProgress);

export default router;
