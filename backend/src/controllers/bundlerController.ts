import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { AuthRequest } from '../middleware/auth';
import {
  getEntryPoint,
  getRelayerWallet,
  isBlockchainAvailable,
  submitUserOperation,
} from '../services/blockchainService';
import { appendAuditLog } from '../services/auditService';
import { UserOperation } from '@trustledger/shared';

/**
 * POST /bundler/submit
 * Accept a fully signed ERC-4337 UserOperation and submit it to EntryPoint.
 */
export async function submitUserOp(req: Request, res: Response): Promise<void> {
  const op: UserOperation = req.body;

  if (!op || !op.sender || !op.callData || !op.signature) {
    res.status(400).json({
      success: false,
      error: 'Invalid UserOperation: sender, callData, and signature are required',
    });
    return;
  }

  const chainOnline = await isBlockchainAvailable();
  if (!chainOnline) {
    res.status(503).json({
      success: false,
      error: 'Blockchain node unavailable — please deploy contracts first',
    });
    return;
  }

  // Sanity checks
  if (!ethers.isAddress(op.sender)) {
    res.status(400).json({ success: false, error: 'Invalid sender address' });
    return;
  }

  // Compute the UserOpHash using EntryPoint
  let userOpHash: string;
  try {
    const ep = getEntryPoint();
    userOpHash = await ep.getUserOpHash(op);
  } catch (err: any) {
    res.status(400).json({ success: false, error: `UserOp hash computation failed: ${err.message}` });
    return;
  }

  // Submit to EntryPoint
  let txHash: string;
  let blockNumber: number;
  try {
    const result = await submitUserOperation(op);
    txHash = result.txHash;
    blockNumber = result.blockNumber;
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Bundler submit failed: ${err.message}` });
    return;
  }

  await appendAuditLog({
    actorId: null,
    actorRole: 'system',
    action: 'USEROP_SUBMITTED',
    entityType: 'System',
    entityId: new (require('mongoose').Types.ObjectId)(),
    metadata: { sender: op.sender, userOpHash, txHash, blockNumber },
    onChainTxHash: txHash,
  });

  res.json({
    success: true,
    userOpHash,
    txHash,
    blockNumber,
    message: 'UserOperation successfully submitted to EntryPoint',
  });
}

/**
 * GET /bundler/status
 */
export async function bundlerStatus(_req: Request, res: Response): Promise<void> {
  const chainOnline = await isBlockchainAvailable();
  let relayerAddress = 'N/A';
  let relayerBalance = '0';

  if (chainOnline && process.env.RELAYER_PRIVATE_KEY) {
    try {
      const relayer = getRelayerWallet();
      relayerAddress = relayer.address;
      const provider = relayer.provider!;
      const balance = await provider.getBalance(relayerAddress);
      relayerBalance = ethers.formatEther(balance);
    } catch (_e) {}
  }

  res.json({
    success: true,
    status: chainOnline ? 'online' : 'offline',
    relayer: { address: relayerAddress, balanceEth: relayerBalance },
    mode: 'TrustLedger Custom Bundler (non-P2P)',
    entryPoint: process.env.CONTRACT_ENTRY_POINT || 'not configured',
  });
}
