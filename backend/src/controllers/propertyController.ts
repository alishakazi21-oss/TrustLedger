import { Request, Response } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Property, LitigationRisk } from '../models/Property';
import { PropertyVersion } from '../models/PropertyVersion';
import { AuthRequest } from '../middleware/auth';
import { getPropertyRegistryContract, isBlockchainAvailable } from '../services/blockchainService';
import { appendAuditLog } from '../services/auditService';

function generateRegistryNumber(): string {
  return `GLR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function computeRisk(
  versionNumber: number,
  deedHash: string,
  ocrText?: string
): { score: number; status: LitigationRisk; details: string } {
  let score = 100;
  const issues: string[] = [];

  if (versionNumber > 3) {
    score -= 20;
    issues.push('Property has been amended multiple times');
  }
  if (deedHash.startsWith('0x0000')) {
    score -= 30;
    issues.push('Deed hash has suspicious pattern');
  }
  if (ocrText?.toLowerCase().includes('dispute')) {
    score -= 25;
    issues.push('Deed text mentions dispute');
  }

  const status: LitigationRisk = score >= 80 ? 'Low' : score >= 50 ? 'Medium' : 'High';
  return { score, status, details: issues.join('; ') || 'No risk factors detected' };
}

export async function registerProperty(req: AuthRequest, res: Response): Promise<void> {
  const { title, address, parcelId, registryNumber, zoning, sqFt, boundaryGeoJSON, boundaryGeoJson, deedData, encumbrances } = req.body;

  const regNum = registryNumber || parcelId || generateRegistryNumber();
  const geoJson = boundaryGeoJSON || boundaryGeoJson || null;
  const encList = Array.isArray(encumbrances) ? encumbrances : [];

  if (!title || !address || !deedData) {
    res.status(400).json({ success: false, error: 'title, address, deedData are required' });
    return;
  }

  const existing = await Property.findOne({ registryNumber: regNum.toUpperCase() });
  if (existing) {
    res.status(409).json({ success: false, error: 'Property with this registry number already exists' });
    return;
  }

  const deedHash = '0x' + crypto.createHash('sha256').update(JSON.stringify(deedData)).digest('hex');
  const risk = computeRisk(1, deedHash);

  // 1. Create canonical Property document
  const property = await Property.create({
    registryNumber: regNum.toUpperCase(),
    currentOwnerId: new Types.ObjectId(req.user!.id),
    boundaryGeoJSON: geoJson,
    encumbrances: encList,
    litigationRiskScore: risk.status,
    status: 'active',
  });

  // 2. Create first PropertyVersion document (Original)
  const version = await PropertyVersion.create({
    propertyId: property._id,
    versionNumber: 1,
    status: 'Original',
    previousVersionId: null,
    ownerIdAtVersion: new Types.ObjectId(req.user!.id),
    changeReason: 'Initial property registration',
    snapshotData: {
      title,
      address,
      parcelId: regNum,
      zoning: zoning || 'Residential',
      sqFt: sqFt || 'N/A',
      deedHash,
      encumbrances: encList,
      litigationRiskScore: risk.status,
    },
    recordedBy: new Types.ObjectId(req.user!.id),
    recordedAt: new Date(),
  });

  // Link property to current version
  property.currentVersionId = version._id as Types.ObjectId;
  await property.save();

  // On-chain registration if chain is online
  const chainOnline = await isBlockchainAvailable();
  if (chainOnline) {
    try {
      const registryContract = getPropertyRegistryContract();
      const tx = await registryContract.registerProperty(
        property._id.toString(),
        regNum,
        deedHash,
        req.user!.id
      );
      const receipt = await tx.wait();
      version.onChainTxHash = receipt.hash;
      version.onChainBlockNumber = receipt.blockNumber;
      await version.save();
    } catch (err) {
      console.warn('[Property] On-chain registration failed (continuing):', err);
    }
  }

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'PROPERTY_REGISTERED',
    entityType: 'Property',
    entityId: property._id as Types.ObjectId,
    metadata: { registryNumber: regNum, deedHash, versionNumber: 1 },
    onChainTxHash: version.onChainTxHash,
  });

  res.status(201).json({
    success: true,
    propertyId: property._id,
    property,
    version,
  });
}

export async function getPropertyHistory(req: Request, res: Response): Promise<void> {
  const { propertyId } = req.params;

  let prop = await Property.findById(propertyId).populate('currentOwnerId', 'name email did');
  if (!prop) {
    prop = await Property.findOne({ registryNumber: propertyId.toUpperCase() }).populate('currentOwnerId', 'name email did');
  }

  if (!prop) {
    res.status(404).json({ success: false, error: 'Property not found' });
    return;
  }

  const versions = await PropertyVersion.find({ propertyId: prop._id })
    .populate('ownerIdAtVersion', 'name email did')
    .populate('recordedBy', 'name email role')
    .sort({ versionNumber: 1 })
    .lean();

  res.json({
    success: true,
    property: prop,
    totalVersions: versions.length,
    versions,
  });
}

export async function getPropertyCurrent(req: Request, res: Response): Promise<void> {
  const { propertyId } = req.params;

  let prop = await Property.findById(propertyId)
    .populate('currentOwnerId', 'name email did smartAccountAddress')
    .populate('currentVersionId');

  if (!prop) {
    prop = await Property.findOne({ registryNumber: propertyId.toUpperCase() })
      .populate('currentOwnerId', 'name email did smartAccountAddress')
      .populate('currentVersionId');
  }

  if (!prop) {
    res.status(404).json({ success: false, error: 'Property not found' });
    return;
  }

  res.json({ success: true, property: prop });
}

export async function amendProperty(req: AuthRequest, res: Response): Promise<void> {
  const { propertyId } = req.params;
  const { changeReason, amendmentReason, deedData, ...updateFields } = req.body;
  const reason = changeReason || amendmentReason || 'Correction applied by registrar';

  let prop = await Property.findById(propertyId);
  if (!prop) {
    prop = await Property.findOne({ registryNumber: propertyId.toUpperCase() });
  }

  if (!prop) {
    res.status(404).json({ success: false, error: 'Property not found' });
    return;
  }

  const latest = await PropertyVersion.findOne({ propertyId: prop._id }).sort({ versionNumber: -1 });
  if (!latest) {
    res.status(404).json({ success: false, error: 'No previous versions found for this property' });
    return;
  }

  const newVersionNumber = latest.versionNumber + 1;
  const newDeedHash = deedData
    ? '0x' + crypto.createHash('sha256').update(JSON.stringify(deedData)).digest('hex')
    : (latest.snapshotData?.deedHash || '0x');

  const risk = computeRisk(newVersionNumber, newDeedHash);

  // 1. Create new Corrected version document
  const newVersion = await PropertyVersion.create({
    propertyId: prop._id,
    versionNumber: newVersionNumber,
    status: 'Corrected',
    previousVersionId: latest._id as Types.ObjectId,
    ownerIdAtVersion: updateFields.newOwnerId ? new Types.ObjectId(updateFields.newOwnerId) : prop.currentOwnerId,
    changeReason: reason,
    snapshotData: {
      ...latest.snapshotData,
      ...updateFields,
      deedHash: newDeedHash,
      litigationRiskScore: risk.status,
    },
    recordedBy: new Types.ObjectId(req.user!.id),
    recordedAt: new Date(),
  });

  // 2. Mark previous version as Superseded (only permitted mutation in version ledger)
  await PropertyVersion.findByIdAndUpdate(latest._id, { status: 'Superseded' });

  // 3. Update canonical Property pointer
  prop.currentVersionId = newVersion._id as Types.ObjectId;
  if (updateFields.newOwnerId) {
    prop.currentOwnerId = new Types.ObjectId(updateFields.newOwnerId);
  }
  prop.litigationRiskScore = risk.status;
  await prop.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'PROPERTY_AMENDED',
    entityType: 'Property',
    entityId: prop._id as Types.ObjectId,
    metadata: { versionNumber: newVersionNumber, changeReason: reason },
  });

  res.status(201).json({
    success: true,
    property: prop,
    version: newVersion,
  });
}

export async function listAllProperties(req: Request, res: Response): Promise<void> {
  const properties = await Property.find()
    .populate('currentOwnerId', 'name email did')
    .populate('currentVersionId')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, total: properties.length, properties });
}
