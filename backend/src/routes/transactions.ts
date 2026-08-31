import { Router } from 'express';
import {
  createTransaction,
  fundEscrow,
  approveTransaction,
  cancelTransaction,
  getTransaction,
  listUserTransactions,
} from '../controllers/transactionController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('individual', 'admin'), createTransaction);
router.get('/', listUserTransactions);
router.get('/:id', getTransaction);
router.post('/:id/fund', requireRole('individual'), fundEscrow);
router.post('/:id/approve', requireRole('individual', 'registrar', 'admin'), approveTransaction);
router.post('/:id/cancel', cancelTransaction);

export default router;
