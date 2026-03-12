import { Router } from 'express';
import { alumniController } from '../controllers/alumni.controller';

const router = Router();

// Public route
router.get('/videos', alumniController.getAlumniVideos);

export default router;
