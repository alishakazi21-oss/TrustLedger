import { Router } from 'express';
import { getDashboardStats, getAuditLogs, listUsers, deactivateUser } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/users', listUsers);
router.post('/users/:userId/deactivate', deactivateUser);

export default router;
