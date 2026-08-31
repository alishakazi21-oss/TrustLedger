import { Request, Response } from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Credential } from '../models/Credential';
import { AuthRequest } from '../middleware/auth';
import {
  generateDID,
  issueVerifiableCredential,
  buildDIDDocument,
  hashNationalId,
  deriveSmartAccountSalt,
} from '../services/identityService';
import {
  getSmartAccountAddress,
  getPaymaster,
  isBlockchainAvailable,
} from '../services/blockchainService';
import { appendAuditLog } from '../services/auditService';

const ISSUER_DID = 'did:ethr:0x0000TrustLedgerIssuerAuthority0000';

export async function onboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, fullName, dob, nationalId, country } = req.body;
  const displayName = name || fullName;

  if (!displayName || !dob || !nationalId || !country) {
    res.status(400).json({
      success: false,
      error: 'name/fullName, dob, nationalId, country are required',
    });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  if (user.kycStatus === 'verified' && user.did) {
    res.status(409).json({ success: false, error: 'Identity already onboarded', did: user.did });
    return;
  }

  // Generate a deterministic EOA-style address for the DID from user ID + national ID
  const seed = crypto.createHash('sha256').update(`${userId}:${nationalId}:${dob}`).digest('hex');
  const wallet = new ethers.Wallet('0x' + seed.slice(0, 64));
  const eoa = wallet.address;

  const did = generateDID(eoa);
  const nationalIdHash = hashNationalId(nationalId, dob);
  const kycTier = 'Tier 3 (Institutional)';

  // Compute counterfactual smart account address
  const salt = deriveSmartAccountSalt(userId);
  let smartAccountAddress: string | null = null;

  const chainOnline = await isBlockchainAvailable();
  if (chainOnline) {
    smartAccountAddress = await getSmartAccountAddress(eoa, salt);
    // Whitelist in paymaster
    try {
      const paymaster = getPaymaster();
      await (await paymaster.setWhitelist(smartAccountAddress, true)).wait();
    } catch (err) {
      console.warn('[Identity] Paymaster whitelist skipped (not critical):', err);
    }
  }

  const vc = issueVerifiableCredential({
    did,
    fullName: user.name || displayName,
    nationalIdHash,
    kycTier,
    issuerDid: ISSUER_DID,
  });

  const credentialHash = crypto.createHash('sha256').update(JSON.stringify(vc)).digest('hex');

  await User.findByIdAndUpdate(userId, {
    name: user.name || displayName,
    did,
    eoa,
    smartAccountAddress,
    nationalIdHash,
    kycStatus: 'verified',
    kycTier,
    reputationScore: 99,
  });

  // Store in credentials collection
  const credRecord = await Credential.create({
    userId: new Types.ObjectId(userId),
    did,
    credentialType: 'TrustLedgerKYCCredential',
    issuer: ISSUER_DID,
    issuedAt: new Date(),
    status: 'active',
    credentialHash,
    credentialPayload: vc as any,
  });

  await appendAuditLog({
    actorId: new Types.ObjectId(userId),
    actorEmail: user.email,
    actorRole: user.role,
    action: 'IDENTITY_ONBOARDED',
    entityType: 'User',
    entityId: new Types.ObjectId(userId),
    metadata: { did, kycTier, smartAccountAddress, credentialId: credRecord._id },
  });

  res.status(201).json({
    success: true,
    did,
    eoa,
    smartAccountAddress,
    kycTier,
    verifiableCredential: vc,
    didDocument: buildDIDDocument(did, eoa),
  });
}

export async function getIdentity(req: Request, res: Response): Promise<void> {
  const { did } = req.params;
  if (!did) {
    res.status(400).json({ success: false, error: 'did param required' });
    return;
  }

  const user = await User.findOne({ did }).select('-passwordHash').lean();
  if (!user) {
    res.status(404).json({ success: false, error: 'DID not found' });
    return;
  }

  const cred = await Credential.findOne({ did, status: 'active' }).lean();

  res.json({
    success: true,
    did: user.did,
    name: user.name,
    fullName: user.name,
    status: user.kycStatus,
    kycTier: user.kycTier,
    verifiableCredential: cred?.credentialPayload || null,
    credentialStatus: cred?.status || 'none',
    didDocument: user.eoa ? buildDIDDocument(user.did!, user.eoa) : null,
    smartAccountAddress: user.smartAccountAddress,
    reputationScore: user.reputationScore,
    isActive: user.isActive,
  });
}
