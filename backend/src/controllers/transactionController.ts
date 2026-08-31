import { Request, Response } from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Property } from '../models/Property';
import { PropertyVersion } from '../models/PropertyVersion';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import {
  getEscrowContract,
  getPropertyRegistryContract,
  isBlockchainAvailable,
} from '../services/blockchainService';
import { appendAuditLog } from '../services/auditService';
import { TransactionStatus } from '../models/Transaction';

function generateTxId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `TX-ESCROW-${year}-${rand}`;
}

export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { propertyId, sellerId, amount, priceUsd } = req.body;
  const finalAmount = amount || priceUsd;

  if (!propertyId || !sellerId || !finalAmount) {
    res.status(400).json({ success: false, error: 'propertyId, sellerId, amount required' });
    return;
  }

  const buyer = await User.findById(req.user!.id);
  const seller = await User.findById(sellerId);
  const property = await Property.findById(propertyId);

  if (!buyer || !seller || !property) {
    res.status(404).json({ success: false, error: 'Buyer, seller, or property not found' });
    return;
  }

  if (property.currentOwnerId.toString() !== sellerId) {
    res.status(400).json({ success: false, error: 'Seller does not own this property' });
    return;
  }

  const txId = generateTxId();
  const escrowAmount = Math.ceil(finalAmount * 1.05); // 5% buffer
  const dealId = ethers.keccak256(ethers.toUtf8Bytes(`${txId}:${propertyId}:${Date.now()}`));

  const transaction = await Transaction.create({
    txId,
    propertyId: property._id,
    buyerId: new Types.ObjectId(req.user!.id),
    sellerId: new Types.ObjectId(sellerId),
    amount: finalAmount,
    escrowAmount,
    status: 'Offered' as TransactionStatus,
    onChainDealId: dealId,
    escrowContractAddress: process.env.CONTRACT_ESCROW || null,
  });

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'TRANSACTION_CREATED',
    entityType: 'Transaction',
    entityId: transaction._id as Types.ObjectId,
    metadata: { txId, propertyId: property._id, amount: finalAmount },
  });

  res.status(201).json({ success: true, transaction });
}

export async function fundEscrow(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const tx = await Transaction.findById(id);
  if (!tx) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  if (tx.buyerId.toString() !== req.user!.id) {
    res.status(403).json({ success: false, error: 'Only buyer can fund escrow' });
    return;
  }
  if (tx.status !== 'Offered') {
    res.status(409).json({ success: false, error: `Invalid status: ${tx.status}` });
    return;
  }

  tx.status = 'EscrowFunded';
  tx.buyerApproved = true;

  const chainOnline = await isBlockchainAvailable();
  if (chainOnline && tx.onChainDealId) {
    try {
      const escrow = getEscrowContract();
      const buyer = await User.findById(tx.buyerId);
      const seller = await User.findById(tx.sellerId);
      const sellerAddress = seller?.smartAccountAddress || seller?.eoa || ethers.ZeroAddress;
      const buyerAddress = buyer?.smartAccountAddress || buyer?.eoa || ethers.ZeroAddress;
      const property = await Property.findById(tx.propertyId);
      const latestVersion = property?.currentVersionId
        ? await PropertyVersion.findById(property.currentVersionId)
        : null;
      const deedHash = latestVersion?.snapshotData?.deedHash || ethers.ZeroHash;

      // Create the deal on-chain
      const createTx = await escrow.createDeal(
        tx.onChainDealId,
        tx.propertyId.toString(),
        buyerAddress,
        sellerAddress,
        ethers.parseEther(tx.amount.toString()),
        deedHash
      );
      await createTx.wait();

      // Fund the escrow
      const fundTx = await escrow.depositFunds(tx.onChainDealId, {
        value: ethers.parseEther(tx.escrowAmount.toString()),
      });
      const receipt = await fundTx.wait();

      tx.onChainTxHash = receipt.hash;
      tx.onChainBlockNumber = receipt.blockNumber;
    } catch (err) {
      console.warn('[Transaction] Escrow funding on-chain skipped:', err);
    }
  }

  await tx.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'ESCROW_FUNDED',
    entityType: 'Transaction',
    entityId: tx._id as Types.ObjectId,
    metadata: { txId: tx.txId, escrowAmount: tx.escrowAmount },
    onChainTxHash: tx.onChainTxHash,
  });

  res.json({ success: true, transaction: tx });
}

export async function approveTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const tx = await Transaction.findById(id);
  if (!tx) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }

  const role = req.user!.role;
  const userId = req.user!.id;

  if (role === 'individual' && tx.sellerId.toString() === userId) {
    tx.sellerApproved = true;
  } else if (role === 'registrar' || role === 'admin') {
    tx.registrarApproved = true;
  } else {
    res.status(403).json({ success: false, error: 'Not authorized to approve this transaction' });
    return;
  }

  // Check if all parties have approved → execute on-chain
  if (tx.buyerApproved && tx.sellerApproved && tx.registrarApproved) {
    tx.status = 'ContractExecuted';

    const chainOnline = await isBlockchainAvailable();
    if (chainOnline && tx.onChainDealId) {
      try {
        const escrow = getEscrowContract();
        const releaseTx = await escrow.approveAndRelease(tx.onChainDealId);
        const receipt = await releaseTx.wait();
        tx.onChainTxHash = receipt.hash;
        tx.onChainBlockNumber = receipt.blockNumber;
        tx.status = 'TitleTransferred';
        tx.completedAt = new Date();

        // Transfer property ownership in MongoDB
        const prop = await Property.findById(tx.propertyId);
        if (prop) {
          prop.currentOwnerId = tx.buyerId;
          prop.status = 'transferred';
          await prop.save();

          // Create new Corrected/Transferred version
          const latestVersion = prop.currentVersionId
            ? await PropertyVersion.findById(prop.currentVersionId)
            : null;

          const newVersion = await PropertyVersion.create({
            propertyId: prop._id,
            versionNumber: (latestVersion?.versionNumber || 1) + 1,
            status: 'Corrected',
            previousVersionId: latestVersion?._id || null,
            ownerIdAtVersion: tx.buyerId,
            changeReason: `Ownership transferred via escrow settlement ${tx.txId}`,
            snapshotData: latestVersion?.snapshotData || {},
            onChainTxHash: receipt.hash,
            onChainBlockNumber: receipt.blockNumber,
            recordedBy: new Types.ObjectId(userId),
            recordedAt: new Date(),
          });

          if (latestVersion) {
            await PropertyVersion.findByIdAndUpdate(latestVersion._id, { status: 'Superseded' });
          }

          prop.currentVersionId = newVersion._id as Types.ObjectId;
          await prop.save();

          const registry = getPropertyRegistryContract();
          const buyer = await User.findById(tx.buyerId);
          const buyerAddr = buyer?.smartAccountAddress || buyer?.eoa || ethers.ZeroAddress;
          const deedHash = latestVersion?.snapshotData?.deedHash || ethers.ZeroHash;
          await (await registry.transferProperty(tx.propertyId.toString(), buyerAddr, deedHash)).wait();
        }
      } catch (err) {
        console.warn('[Transaction] On-chain release failed:', err);
      }
    }
  }

  await tx.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(userId),
    actorRole: role,
    action: 'TRANSACTION_APPROVED',
    entityType: 'Transaction',
    entityId: tx._id as Types.ObjectId,
    metadata: { txId: tx.txId, status: tx.status, approverRole: role },
    onChainTxHash: tx.onChainTxHash,
  });

  res.json({ success: true, transaction: tx });
}

export async function cancelTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  const tx = await Transaction.findById(id);
  if (!tx) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }

  if (!['Offered', 'EscrowFunded', 'Verifying'].includes(tx.status)) {
    res.status(409).json({ success: false, error: `Cannot cancel a transaction in ${tx.status} state` });
    return;
  }

  if (tx.status === 'EscrowFunded') {
    tx.status = 'Refunded';
    const chainOnline = await isBlockchainAvailable();
    if (chainOnline && tx.onChainDealId) {
      try {
        const escrow = getEscrowContract();
        await (await escrow.refundBuyer(tx.onChainDealId)).wait();
      } catch (err) {
        console.warn('[Transaction] Refund on-chain failed:', err);
      }
    }
  } else {
    tx.status = 'Cancelled';
  }

  tx.rejectionReason = reason;
  tx.completedAt = new Date();
  await tx.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'TRANSACTION_CANCELLED',
    entityType: 'Transaction',
    entityId: tx._id as Types.ObjectId,
    metadata: { txId: tx.txId, reason },
  });

  res.json({ success: true, transaction: tx });
}

export async function getTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const tx = await Transaction.findById(id)
    .populate('propertyId')
    .populate('buyerId', 'name email did')
    .populate('sellerId', 'name email did')
    .lean();

  if (!tx) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, transaction: tx });
}

export async function listUserTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = new Types.ObjectId(req.user!.id);
  const txs = await Transaction.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate('propertyId')
    .populate('buyerId', 'name email did')
    .populate('sellerId', 'name email did')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, total: txs.length, transactions: txs });
}
