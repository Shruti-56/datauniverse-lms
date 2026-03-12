import { Router } from 'express';
import { promoBannerController } from '../controllers/promoBanner.controller';

const router = Router();

// Public: list active banners for student dashboard (no auth required)
router.get('/', promoBannerController.listPublic);

export default router;
