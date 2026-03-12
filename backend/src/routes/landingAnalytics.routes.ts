import { Router } from 'express';
import * as landingAnalyticsController from '../controllers/landingAnalytics.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

// Public: track a visit (no auth - used by landing page on load)
router.post('/track', landingAnalyticsController.trackVisit);

// Public: submit lead form - emails to SMTP_USER in .env
router.post('/lead', landingAnalyticsController.submitLead);

// Public: create lead + Stripe checkout session (₹99)
router.post('/lead/checkout', landingAnalyticsController.createLeadCheckout);

// Public: verify Stripe session and mark lead as paid
router.get('/lead/verify', landingAnalyticsController.verifyLeadPayment);

// Public: submit marketing contact/enquiry form
router.post('/contact', landingAnalyticsController.submitContact);

// Admin only: list all landing pages with counts
router.get('/', authenticate, requireAdmin, landingAnalyticsController.listPages);

// Admin only: get analytics for a specific page
router.get('/:pageSlug', authenticate, requireAdmin, landingAnalyticsController.getAnalytics);

// Public: get landing page config (date/time/mode etc.) for a page
router.get('/:pageSlug/config', landingAnalyticsController.getLandingConfig);

// Admin only: update landing page config
router.put('/:pageSlug/config', authenticate, requireAdmin, landingAnalyticsController.upsertLandingConfig);

// Admin only: list leads for a landing page
router.get('/:pageSlug/leads', authenticate, requireAdmin, landingAnalyticsController.listLeads);

export default router;
