import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', enrollmentController.getMyEnrollments);
router.post('/', enrollmentController.enrollInCourse);

export default router;
