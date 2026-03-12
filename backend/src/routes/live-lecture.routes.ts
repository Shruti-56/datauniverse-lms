import { Router } from 'express';
import { liveLectureController } from '../controllers/live-lecture.controller';
import { authenticate } from '../middleware/auth';
import { requireStudent } from '../middleware/roleGuard';

const router = Router();

// Student: my live lectures (batches I'm in)
router.get('/', authenticate, requireStudent, liveLectureController.listLecturesStudent);
// Student: summary of my batches (for dashboard & My Learning)
router.get('/my-batches', authenticate, requireStudent, liveLectureController.getMyBatchesSummary);
// Student: click join link from email → mark attendance, get redirect URL to meeting
router.get('/:lectureId/join', authenticate, requireStudent, liveLectureController.getJoinRedirect);
// Student: get watch URL for a lecture recording (must be in batch)
router.get('/:lectureId/recording-url', authenticate, requireStudent, liveLectureController.getRecordingWatchUrl);

export default router;
