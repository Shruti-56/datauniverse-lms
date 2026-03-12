import { Router } from 'express';
import { interviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', interviewController.getInterviews);
router.put('/:id/attendance', interviewController.markAttendance);
router.post('/:id/feedback', interviewController.submitFeedback);
router.put('/:id/recording', interviewController.uploadRecording);
router.post('/:id/recording/upload-url', interviewController.getRecordingUploadUrl);
router.get('/:id/recording-url', interviewController.getRecordingWatchUrl);
router.put('/:id/cancel', interviewController.cancelInterview);

export default router;
