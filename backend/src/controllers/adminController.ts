import { Request, Response } from 'express';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { Transaction } from '../models/Transaction';
import { TLDocument } from '../models/Document';
import { AuditLog } from '../models/AuditLog';
import { getPaymaster, isBlockchainAvailable } from '../services/blockchainService';
import { AuthRequest } from '../middleware/auth';
import { ethers } from 'ethers';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [totalUsers, verifiedUsers, totalProperties, totalTransactions, totalDocuments] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ kycStatus: 'verified' }),
      Property.countDocuments(),
      Transaction.countDocuments(),
      TLDocument.countDocuments(),
    ]);

  const completedTransactions = await Transaction.countDocuments({ status: 'TitleTransferred' });
  const pendingTransactions = await Transaction.countDocuments({
    status: { $in: ['Offered', 'EscrowFunded', 'Verifying'] },
  });

  let paymasterStats = { totalGasSponsored: '0', totalOperations: 0, deposit: '0' };
  const chainOnline = await isBlockchainAvailable();
  if (chainOnline) {
    try {
      const paymaster = getPaymaster();
      const [totalGas, totalOps, deposit] = await Promise.all([
        paymaster.totalGasSponsored(),
        paymaster.totalOperationsSponsored(),
        paymaster.getDeposit(),
      ]);
      paymasterStats = {
        totalGasSponsored: ethers.formatEther(totalGas),
        totalOperations: Number(totalOps),
        deposit: ethers.formatEther(deposit),
      };
    } catch (_e) {}
  }

  res.json({
    success: true,
    stats: {
      users: { total: totalUsers, verified: verifiedUsers },
      properties: { total: totalProperties },
      transactions: { total: totalTransactions, completed: completedTransactions, pending: pendingTransactions },
      documents: { total: totalDocuments },
      paymaster: paymasterStats,
      chainOnline,
    },
  });
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;

  const filter: Record<string, any> = {};
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    logs,
  });
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const role = req.query.role as string;
  const kycStatus = req.query.kycStatus as string;

  const filter: Record<string, any> = {};
  if (role) filter.role = role;
  if (kycStatus) filter.kycStatus = kycStatus;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), users });
}

export async function deactivateUser(req: AuthRequest, res: Response): Promise<void> {
  const { userId } = req.params;

  if (req.user!.id === userId) {
    res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
    return;
  }

  await User.findByIdAndUpdate(userId, { isActive: false });
  res.json({ success: true, message: 'User deactivated' });
}
