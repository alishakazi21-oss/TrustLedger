import { Router } from 'express';
import {
  registerProperty,
  getPropertyHistory,
  getPropertyCurrent,
  amendProperty,
  listAllProperties,
} from '../controllers/propertyController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', listAllProperties);
router.get('/:propertyId', getPropertyCurrent);
router.get('/:propertyId/history', getPropertyHistory);

router.post('/', authenticate, requireRole('registrar', 'admin', 'individual'), registerProperty);
router.post('/:propertyId/amend', authenticate, requireRole('registrar', 'admin'), amendProperty);

export default router;
