import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Course assignments (requires auth to show submission status) - must come before /:id
router.get('/course/:courseId', authenticate, assignmentController.getCourseAssignments);

// Student routes (with optional auth for enrollment status)
router.get('/:id', optionalAuth, assignmentController.getAssignment);

export default router;
