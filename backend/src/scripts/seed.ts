/**
 * TrustLedger Seed Script
 * Seeds demo records across all 9 collections:
 * users, credentials, documents, urlScanResults, properties,
 * propertyVersions, transactions, auditLogs, smartContractRegistry.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';
import { User } from '../models/User';
import { Credential } from '../models/Credential';
import { TLDocument } from '../models/Document';
import { URLScanResult } from '../models/URLScanResult';
import { Property } from '../models/Property';
import { PropertyVersion } from '../models/PropertyVersion';
import { Transaction } from '../models/Transaction';
import { AuditLog } from '../models/AuditLog';
import { SmartContractRegistry } from '../models/SmartContractRegistry';
import {
  generateDID,
  issueVerifiableCredential,
  hashNationalId,
} from '../services/identityService';

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('✅ Connected to MongoDB:', config.mongoUri);

  // ── Clean existing collections ───────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Credential.deleteMany({}),
    TLDocument.deleteMany({}),
    URLScanResult.deleteMany({}),
    Property.deleteMany({}),
    PropertyVersion.deleteMany({}),
    Transaction.deleteMany({}),
    AuditLog.deleteMany({}),
    SmartContractRegistry.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing collections across all 9 models');

  // ── 1. Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const makeUser = async (data: {
    email: string;
    name: string;
    role: 'individual' | 'issuer' | 'verifier' | 'registrar' | 'admin';
    nationalId?: string;
  }) => {
    const did = data.nationalId
      ? generateDID(`0x${crypto.createHash('sha256').update(data.email).digest('hex').slice(0, 40)}`)
      : null;

    const nationalIdHash = data.nationalId
      ? hashNationalId(data.nationalId, '1990-01-01')
      : null;

    const user = await User.create({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      did,
      kycStatus: data.nationalId ? 'verified' : 'pending',
      kycTier: data.nationalId ? 'Tier 3 (Institutional)' : 'Tier 0 (Unverified)',
      nationalIdHash,
      reputationScore: data.nationalId ? 99 : 0,
    });

    // ── 2. Credentials (if user is verified) ───────────────────────────────
    if (data.nationalId && did) {
      const vc = issueVerifiableCredential({
        did,
        fullName: data.name,
        nationalIdHash: nationalIdHash!,
        kycTier: 'Tier 3 (Institutional)',
        issuerDid: 'did:ethr:0x0000TrustLedgerIssuerAuthority0000',
      });

      const credentialHash = crypto.createHash('sha256').update(JSON.stringify(vc)).digest('hex');

      await Credential.create({
        userId: user._id,
        did,
        credentialType: 'TrustLedgerKYCCredential',
        issuer: 'did:ethr:0x0000TrustLedgerIssuerAuthority0000',
        issuedAt: new Date(),
        status: 'active',
        credentialHash,
        credentialPayload: vc as any,
      });
    }

    return user;
  };

  const admin = await makeUser({
    email: 'admin@trustledger.network',
    name: 'System Admin',
    role: 'admin',
    nationalId: 'ADMIN-001',
  });

  const buyer = await makeUser({
    email: 'buyer@trustledger.network',
    name: 'Helena Vance-Croft',
    role: 'individual',
    nationalId: 'NID-HVC-9912',
  });

  const seller = await makeUser({
    email: 'seller@trustledger.network',
    name: 'Alexander Sterling',
    role: 'individual',
    nationalId: 'NID-AS-4019',
  });

  const registrar = await makeUser({
    email: 'registrar@trustledger.network',
    name: 'Patricia Okoye',
    role: 'registrar',
    nationalId: 'REG-PO-7711',
  });

  const issuer = await makeUser({
    email: 'issuer@trustledger.network',
    name: 'Northshore Bank Issuer',
    role: 'issuer',
    nationalId: 'BANK-NSB-3301',
  });

  const verifier = await makeUser({
    email: 'verifier@trustledger.network',
    name: 'Apex Mortgage Verifier',
    role: 'verifier',
    nationalId: 'VER-AMV-0052',
  });

  console.log('👤 Created 6 users & corresponding credentials');

  // ── 5. Properties & 6. PropertyVersions ──────────────────────────────────
  const makeProperty = async (opts: {
    registryNumber: string;
    title: string;
    address: string;
    ownerId: Types.ObjectId;
    riskScore: 'Low' | 'Medium' | 'High';
    encumbrances: string[];
    sqFt: string;
  }) => {
    const deedData = { ...opts, createdAt: new Date().toISOString() };
    const deedHash = '0x' + crypto.createHash('sha256').update(JSON.stringify(deedData)).digest('hex');

    const prop = await Property.create({
      registryNumber: opts.registryNumber,
      currentOwnerId: opts.ownerId,
      boundaryGeoJSON: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.1278, 51.5074],
            [-0.1275, 51.5074],
            [-0.1275, 51.5078],
            [-0.1278, 51.5078],
            [-0.1278, 51.5074],
          ],
        ],
      },
      encumbrances: opts.encumbrances,
      litigationRiskScore: opts.riskScore,
      status: 'active',
    });

    const version = await PropertyVersion.create({
      propertyId: prop._id,
      versionNumber: 1,
      status: 'Original',
      previousVersionId: null,
      ownerIdAtVersion: opts.ownerId,
      changeReason: 'Initial registration on cadastre ledger',
      snapshotData: {
        title: opts.title,
        address: opts.address,
        parcelId: opts.registryNumber,
        zoning: 'Residential',
        sqFt: opts.sqFt,
        deedHash,
        encumbrances: opts.encumbrances,
        litigationRiskScore: opts.riskScore,
      },
      recordedBy: registrar._id as Types.ObjectId,
      recordedAt: new Date(),
    });

    prop.currentVersionId = version._id as Types.ObjectId;
    await prop.save();

    return { prop, version };
  };

  const { prop: prop1 } = await makeProperty({
    registryNumber: 'GLR-GB-9821',
    title: '14 Birchwood Crescent',
    address: '14 Birchwood Crescent, London, SW3 4QR',
    ownerId: seller._id as Types.ObjectId,
    riskScore: 'Low',
    encumbrances: [],
    sqFt: '2,400 sq ft',
  });

  const { prop: prop2, version: prop2V1 } = await makeProperty({
    registryNumber: 'GLR-GB-4019',
    title: 'Queensgate Terrace, Apt 7',
    address: 'Queensgate Terrace, Apt 7, Edinburgh, EH1 2AB',
    ownerId: seller._id as Types.ObjectId,
    riskScore: 'Medium',
    encumbrances: ['Historical lien resolved 2022'],
    sqFt: '2,150 sq ft',
  });

  await makeProperty({
    registryNumber: 'GLR-GB-7301',
    title: 'The Old Mill Commercial Unit',
    address: 'The Old Mill, Unit 3, Manchester, M1 5QJ',
    ownerId: admin._id as Types.ObjectId,
    riskScore: 'High',
    encumbrances: ['Active boundary litigation vs adjacent parcel'],
    sqFt: '4,800 sq ft',
  });

  // Amendment on prop2 to demonstrate append-only versioning
  const deedDataV2 = { registryNumber: 'GLR-GB-4019', amendment: 'Surveyor boundary correction', version: 2 };
  const deedHashV2 = '0x' + crypto.createHash('sha256').update(JSON.stringify(deedDataV2)).digest('hex');

  const prop2V2 = await PropertyVersion.create({
    propertyId: prop2._id,
    versionNumber: 2,
    status: 'Corrected',
    previousVersionId: prop2V1._id as Types.ObjectId,
    ownerIdAtVersion: seller._id as Types.ObjectId,
    changeReason: 'Surveyor boundary correction — 2024 re-assessment report #SR-9912',
    snapshotData: {
      title: 'Queensgate Terrace, Apt 7 (Amended)',
      address: 'Queensgate Terrace, Apt 7, Edinburgh, EH1 2AB',
      parcelId: 'GLR-GB-4019',
      zoning: 'Residential',
      sqFt: '2,150 sq ft',
      deedHash: deedHashV2,
      encumbrances: ['Surveyor verified clean boundary 2024'],
      litigationRiskScore: 'Medium',
    },
    recordedBy: registrar._id as Types.ObjectId,
    recordedAt: new Date(),
  });

  await PropertyVersion.findByIdAndUpdate(prop2V1._id, { status: 'Superseded' });
  prop2.currentVersionId = prop2V2._id as Types.ObjectId;
  await prop2.save();

  console.log('🏠 Created 3 properties + immutable version history (v1 Original → v2 Corrected)');

  // ── 3. Documents & 4. URLScanResults ─────────────────────────────────────
  const doc1 = await TLDocument.create({
    ownerId: buyer._id as Types.ObjectId,
    propertyId: prop1._id,
    docType: 'National ID',
    originalFileName: 'helena_national_id.png',
    storagePath: './uploads/demo-doc-001.png',
    mimeType: 'image/png',
    fileSizeBytes: 143200,
    originalHash: '9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
    ocrExtractedText: 'NATIONAL IDENTITY DOCUMENT\nName: Helena Vance-Croft\nID: NID-HVC-9912\nDOB: 1990-03-15\nExpiry: 2032-03-15',
    ocrStatus: 'completed',
    verificationStatus: 'verified',
    verificationNote: 'Verified against authoritative government registry records',
    verifiedBy: registrar._id as Types.ObjectId,
    verifiedAt: new Date(),
  });

  const doc2 = await TLDocument.create({
    ownerId: buyer._id as Types.ObjectId,
    propertyId: prop1._id,
    docType: 'Title Deed',
    originalFileName: 'tampered_deed_example.pdf',
    storagePath: './uploads/demo-doc-002.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 892100,
    originalHash: 'aabbcc112233deadbeef009900112233445566778899aabbccddeeff00112233',
    ocrExtractedText: 'PROPERTY DEED\nParcel: GLR-GB-FAKE\nLand Registry Verification: http://land-registry-clone.com/verify?id=XZ91\nIssued by: FORGED AUTHORITY 2024',
    ocrStatus: 'completed',
    verificationStatus: 'tampered',
    verificationNote: 'Tampered deed: Flagged by zero-trust URL scanner and missing from registry index',
  });

  await URLScanResult.create({
    documentId: doc2._id,
    url: 'http://land-registry-clone.com/verify?id=XZ91',
    isSafe: false,
    riskScore: 92,
    riskReasons: [
      'Non-HTTPS protocol detected',
      'Lookalike domain mimicking official land registry: land-registry-clone.com',
    ],
    hostname: 'land-registry-clone.com',
    scannedAt: new Date(),
  });

  console.log('📄 Created 2 documents & URL scan results (1 verified, 1 tampered with risk score 92)');

  // ── 7. Transactions ──────────────────────────────────────────────────────
  const tx = await Transaction.create({
    txId: 'TX-ESCROW-2026-8819',
    propertyId: prop1._id,
    buyerId: buyer._id as Types.ObjectId,
    sellerId: seller._id as Types.ObjectId,
    amount: 485000,
    escrowAmount: 509250,
    status: 'EscrowFunded',
    buyerApproved: true,
    sellerApproved: false,
    registrarApproved: false,
    onChainDealId: '0x' + crypto.createHash('sha256').update('TX-ESCROW-2026-8819').digest('hex'),
    escrowContractAddress: '0x0000000000000000000000000000000000000000',
  });

  console.log('💼 Created 1 demo transaction: TX-ESCROW-2026-8819 (EscrowFunded state)');

  // ── 8. Audit Logs ────────────────────────────────────────────────────────
  await AuditLog.insertMany([
    {
      actorId: null,
      actorEmail: 'system@trustledger.network',
      actorRole: 'system',
      action: 'SYSTEM_BOOT',
      entityType: 'System',
      entityId: new Types.ObjectId(),
      metadata: { note: 'TrustLedger database initialized' },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      actorId: buyer._id as Types.ObjectId,
      actorEmail: buyer.email,
      actorRole: 'individual',
      action: 'IDENTITY_ONBOARDED',
      entityType: 'User',
      entityId: buyer._id as Types.ObjectId,
      metadata: { did: buyer.did, kycTier: 'Tier 3 (Institutional)' },
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      actorId: registrar._id as Types.ObjectId,
      actorEmail: registrar.email,
      actorRole: 'registrar',
      action: 'PROPERTY_REGISTERED',
      entityType: 'Property',
      entityId: prop1._id,
      metadata: { registryNumber: 'GLR-GB-9821' },
      timestamp: new Date(Date.now() - 2400000),
    },
    {
      actorId: buyer._id as Types.ObjectId,
      actorEmail: buyer.email,
      actorRole: 'individual',
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc1._id,
      metadata: { fileName: doc1.originalFileName, verificationStatus: 'verified' },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      actorId: buyer._id as Types.ObjectId,
      actorEmail: buyer.email,
      actorRole: 'individual',
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc2._id,
      metadata: { fileName: doc2.originalFileName, verificationStatus: 'tampered' },
      timestamp: new Date(Date.now() - 1200000),
    },
    {
      actorId: buyer._id as Types.ObjectId,
      actorEmail: buyer.email,
      actorRole: 'individual',
      action: 'TRANSACTION_CREATED',
      entityType: 'Transaction',
      entityId: tx._id,
      metadata: { txId: 'TX-ESCROW-2026-8819', amount: 485000 },
      timestamp: new Date(Date.now() - 600000),
    },
    {
      actorId: buyer._id as Types.ObjectId,
      actorEmail: buyer.email,
      actorRole: 'individual',
      action: 'ESCROW_FUNDED',
      entityType: 'Transaction',
      entityId: tx._id,
      metadata: { txId: 'TX-ESCROW-2026-8819', escrowAmount: 509250 },
      timestamp: new Date(Date.now() - 300000),
    },
  ]);

  console.log('📝 Created audit log entries indexed by { entityType, entityId, timestamp }');

  // ── 9. SmartContractRegistry ─────────────────────────────────────────────
  await SmartContractRegistry.insertMany([
    {
      contractType: 'EntryPoint',
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      network: 'localhost',
      chainId: 31337,
      abiRef: './contracts/artifacts/@account-abstraction/contracts/core/EntryPoint.sol/EntryPoint.json',
      deployedAt: new Date(),
      isActive: true,
    },
    {
      contractType: 'AccountFactory',
      address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      network: 'localhost',
      chainId: 31337,
      abiRef: './contracts/artifacts/contracts/core/AccountFactory.sol/AccountFactory.json',
      deployedAt: new Date(),
      isActive: true,
    },
    {
      contractType: 'Paymaster',
      address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      network: 'localhost',
      chainId: 31337,
      abiRef: './contracts/artifacts/contracts/core/TrustLedgerPaymaster.sol/TrustLedgerPaymaster.json',
      deployedAt: new Date(),
      isActive: true,
    },
    {
      contractType: 'PropertyRegistry',
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      network: 'localhost',
      chainId: 31337,
      abiRef: './contracts/artifacts/contracts/realestate/PropertyRegistry.sol/PropertyRegistry.json',
      deployedAt: new Date(),
      isActive: true,
    },
    {
      contractType: 'Escrow',
      address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      network: 'localhost',
      chainId: 31337,
      abiRef: './contracts/artifacts/contracts/realestate/Escrow.sol/Escrow.json',
      deployedAt: new Date(),
      isActive: true,
    },
  ]);

  console.log('⛓️  Registered 5 smart contracts in SmartContractRegistry');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TrustLedger 9-Collection MongoDB Schema Seed Complete');
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
