import { Router } from 'express';
import { policyController } from '../controllers/policy.controller';

const router = Router();

// Public routes
router.get('/', policyController.getPolicies);
router.get('/:type', policyController.getPolicyByType);

export default router;
