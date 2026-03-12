import { Router } from 'express';
import { submissionController } from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Student submissions
router.post('/assignment/:assignmentId', submissionController.submitAssignment);
router.post('/project/:projectId', submissionController.submitProject);
router.post('/upload-url', submissionController.getUploadUrl);
router.get('/my', submissionController.getMySubmissions);

// Instructor/admin review only
router.get('/review', requireRoles(UserRole.INSTRUCTOR, UserRole.ADMIN), submissionController.getSubmissionsForReview);
router.get('/:id/download-url', submissionController.getSubmissionDownloadUrl);
router.put('/:id/review', requireRoles(UserRole.INSTRUCTOR, UserRole.ADMIN), submissionController.reviewSubmission);

export default router;
