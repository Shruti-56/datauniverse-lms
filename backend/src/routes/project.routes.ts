import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Course projects - must come before /:id
router.get('/course/:courseId', authenticate, projectController.getCourseProjects);

// Student routes
router.get('/:id', optionalAuth, projectController.getProject);

export default router;
