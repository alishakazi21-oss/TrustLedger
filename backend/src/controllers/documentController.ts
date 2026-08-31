import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { TLDocument } from '../models/Document';
import { URLScanResult } from '../models/URLScanResult';
import {
  computeFileSHA256,
  runOCR,
  crossCheckRegistry,
} from '../services/documentService';
import { scanDocumentURLs } from '../services/urlScannerService';
import { appendAuditLog } from '../services/auditService';

export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const userId = req.user!.id;
  const { propertyId, documentType, docType } = req.body;
  const filePath = req.file.path;
  const finalDocType = docType || documentType || 'Unspecified Document';

  // 1. Compute SHA-256 hash of the file
  const sha256Hash = await computeFileSHA256(filePath);

  // Check duplicate hash
  const existing = await TLDocument.findOne({ originalHash: sha256Hash });
  if (existing) {
    res.status(409).json({
      success: false,
      error: 'Duplicate document: A document with this identical SHA-256 hash already exists in TrustLedger',
      documentId: existing._id,
    });
    return;
  }

  // 2. Create initial document record
  const doc = await TLDocument.create({
    ownerId: new Types.ObjectId(userId),
    propertyId: propertyId ? new Types.ObjectId(propertyId) : null,
    docType: finalDocType,
    originalFileName: req.file.originalname,
    storagePath: filePath,
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    originalHash: sha256Hash,
    ocrStatus: 'pending',
    verificationStatus: 'pending',
  });

  // 3. OCR extraction
  let ocrText = '';
  try {
    ocrText = await runOCR(filePath);
    doc.ocrExtractedText = ocrText;
    doc.ocrStatus = 'completed';
  } catch (err) {
    console.warn('[Document] OCR failed:', err);
    doc.ocrStatus = 'failed';
  }

  // 4. Registry cross-check
  const crossCheck = crossCheckRegistry(sha256Hash, ocrText);

  // 5. URL scanner
  const urlScan = scanDocumentURLs(ocrText);

  // Save individual URL scan results into the urlScanResults collection
  for (const result of urlScan.results) {
    let hostname: string | null = null;
    try {
      hostname = new URL(result.url).hostname;
    } catch (_e) {}

    await URLScanResult.create({
      documentId: doc._id,
      url: result.url,
      isSafe: result.verdict === 'safe',
      riskScore: result.verdict === 'safe' ? 0 : 85,
      riskReasons: result.reason ? [result.reason] : [],
      hostname,
      scannedAt: new Date(),
    });
  }

  // 6. Final verification status
  const isVerified = crossCheck.status === 'match' && urlScan.verdict === 'safe';
  const isTampered = crossCheck.status === 'mismatch' || urlScan.verdict === 'unsafe';

  doc.verificationStatus = isVerified ? 'verified' : isTampered ? 'tampered' : 'pending';
  doc.verificationNote = isTampered
    ? 'Automated security scan flagged potential tampering or unsafe embedded URLs'
    : 'Passed automated verification checks';

  await doc.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(userId),
    actorRole: req.user!.role,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'Document',
    entityId: doc._id as Types.ObjectId,
    metadata: {
      fileName: doc.originalFileName,
      sha256Hash,
      verificationStatus: doc.verificationStatus,
      urlVerdict: urlScan.verdict,
      registryStatus: crossCheck.status,
    },
  });

  res.status(201).json({
    success: true,
    document: {
      id: doc._id,
      originalHash: doc.originalHash,
      sha256Hash: doc.originalHash,
      docType: doc.docType,
      ocrStatus: doc.ocrStatus,
      registryMatchStatus: crossCheck.status,
      registryMatchDetails: crossCheck,
      urlScanResults: urlScan,
      verificationStatus: doc.verificationStatus,
      verificationNote: doc.verificationNote,
      propertyId: doc.propertyId,
      uploadedAt: doc.uploadedAt,
      createdAt: doc.createdAt,
    },
  });
}

export async function getDocumentStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const doc = await TLDocument.findById(id).lean();

  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  const urlScans = await URLScanResult.find({ documentId: doc._id }).lean();

  res.json({
    success: true,
    document: {
      id: doc._id,
      docType: doc.docType,
      originalHash: doc.originalHash,
      sha256Hash: doc.originalHash,
      ocrStatus: doc.ocrStatus,
      verificationStatus: doc.verificationStatus,
      verificationNote: doc.verificationNote,
      isRevoked: doc.verificationStatus === 'revoked',
      urlScans,
      uploadedAt: doc.uploadedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
  });
}

export async function revokeDocument(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  const doc = await TLDocument.findById(id);
  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  if (doc.verificationStatus === 'revoked') {
    res.status(409).json({ success: false, error: 'Document already revoked' });
    return;
  }

  doc.verificationStatus = 'revoked';
  doc.verificationNote = reason || 'Revoked by authorized user';
  doc.verifiedBy = new Types.ObjectId(req.user!.id);
  doc.verifiedAt = new Date();
  await doc.save();

  await appendAuditLog({
    actorId: new Types.ObjectId(req.user!.id),
    actorRole: req.user!.role,
    action: 'DOCUMENT_REVOKED',
    entityType: 'Document',
    entityId: new Types.ObjectId(id),
    metadata: { reason: doc.verificationNote },
  });

  res.json({ success: true, message: 'Document revoked', documentId: id });
}
