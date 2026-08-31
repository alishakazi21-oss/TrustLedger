import { Router } from 'express';
import { onboard, getIdentity } from '../controllers/identityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/onboard', authenticate, onboard);
router.get('/:did', getIdentity);           // Public: resolve any DID

export default router;
