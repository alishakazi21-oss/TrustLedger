import { Router } from 'express';
import { submitUserOp, bundlerStatus } from '../controllers/bundlerController';

const router = Router();

// Public — only the backend itself should call this in production
// For the demo, open access is fine
router.get('/status', bundlerStatus);
router.post('/submit', submitUserOp);

export default router;
