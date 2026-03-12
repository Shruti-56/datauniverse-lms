import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const courseController = new CourseController();

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.get('/:id/modules', optionalAuth, courseController.getCourseModules);

// Protected routes (requires authentication)
router.get('/:id/content', authenticate, courseController.getCourseContent);

export default router;
