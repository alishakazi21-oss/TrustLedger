import mongoose from 'mongoose';
import { config } from './index';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Credential } from '../models/Credential';
import { TLDocument } from '../models/Document';
import { URLScanResult } from '../models/URLScanResult';
import { Property } from '../models/Property';
import { PropertyVersion } from '../models/PropertyVersion';
import { Transaction } from '../models/Transaction';
import { AuditLog } from '../models/AuditLog';
import { SmartContractRegistry } from '../models/SmartContractRegistry';
import { generateDID, issueVerifiableCredential, hashNationalId } from '../services/identityService';

export async function connectDatabase(): Promise<void> {
  try {
    console.log('[DB] Connecting to MongoDB at:', config.mongoUri);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log('✅ [DB] MongoDB successfully connected to:', config.mongoUri);
    await autoSeedIfEmpty();
  } catch (err: any) {
    console.warn('⚠️ [DB] Local MongoDB connection timed out:', err.message);
    try {
      console.log('[DB] Starting In-Memory MongoMemoryServer fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ [DB] MongoMemoryServer connected at:', uri);
      await autoSeedIfEmpty();
    } catch (fallbackErr: any) {
      console.error('❌ [DB] Database initialization failed. Running in API-only mode without persistence:', fallbackErr.message);
    }
  }
}

async function autoSeedIfEmpty(): Promise<void> {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[DB] Database already populated (${userCount} users found).`);
      return;
    }
    console.log('[DB] Database is empty. Running automatic baseline seed...');

    const passwordHash = await bcrypt.hash('Demo@1234', 10);
    const makeUser = async (data: { email: string; name: string; role: any; nationalId?: string }) => {
      const did = data.nationalId
        ? generateDID(`0x${crypto.createHash('sha256').update(data.email).digest('hex').slice(0, 40)}`)
        : null;
      const nationalIdHash = data.nationalId ? hashNationalId(data.nationalId, '1990-01-01') : null;

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

    const admin = await makeUser({ email: 'admin@trustledger.network', name: 'System Admin', role: 'admin', nationalId: 'ADMIN-001' });
    const buyer = await makeUser({ email: 'buyer@trustledger.network', name: 'Alexander Sterling', role: 'individual', nationalId: 'NID-AS-4019' });
    const seller = await makeUser({ email: 'seller@trustledger.network', name: 'Helena Vance-Croft', role: 'individual', nationalId: 'NID-HVC-9912' });
    const registrar = await makeUser({ email: 'registrar@trustledger.network', name: 'Patricia Okoye', role: 'registrar', nationalId: 'REG-PO-7711' });
    await makeUser({ email: 'issuer@trustledger.network', name: 'Northshore Bank Issuer', role: 'issuer', nationalId: 'BANK-NSB-3301' });
    await makeUser({ email: 'verifier@trustledger.network', name: 'Apex Mortgage Verifier', role: 'verifier', nationalId: 'VER-AMV-0052' });

    // Properties & Versions
    const deedData = { registryNumber: 'GLR-GB-9821', title: '14 Birchwood Crescent', createdAt: new Date().toISOString() };
    const deedHash = '0x' + crypto.createHash('sha256').update(JSON.stringify(deedData)).digest('hex');

    const prop = await Property.create({
      registryNumber: 'GLR-GB-9821',
      currentOwnerId: seller._id,
      boundaryGeoJSON: { type: 'Polygon', coordinates: [[[-0.1278, 51.5074], [-0.1275, 51.5074], [-0.1275, 51.5078], [-0.1278, 51.5078], [-0.1278, 51.5074]]] },
      encumbrances: [],
      litigationRiskScore: 'Low',
      status: 'active',
    });

    const v1 = await PropertyVersion.create({
      propertyId: prop._id,
      versionNumber: 1,
      status: 'Original',
      previousVersionId: null,
      ownerIdAtVersion: seller._id,
      changeReason: 'Initial registration on cadastre ledger',
      snapshotData: { title: '14 Birchwood Crescent', address: '14 Birchwood Crescent, London, SW3 4QR', parcelId: 'GLR-GB-9821', zoning: 'Residential', sqFt: '2,400 sq ft', deedHash, encumbrances: [], litigationRiskScore: 'Low' },
      recordedBy: registrar._id,
      recordedAt: new Date(),
    });

    prop.currentVersionId = v1._id;
    await prop.save();

    // Documents & Scans
    const doc1 = await TLDocument.create({
      ownerId: buyer._id,
      propertyId: prop._id,
      docType: 'National ID',
      originalFileName: 'alex_sterling_nid.png',
      storagePath: './uploads/demo-doc-001.png',
      mimeType: 'image/png',
      fileSizeBytes: 143200,
      originalHash: '9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
      ocrExtractedText: 'NATIONAL IDENTITY DOCUMENT\nName: Alexander Sterling\nID: NID-AS-4019\nDOB: 1990-01-01',
      ocrStatus: 'completed',
      verificationStatus: 'verified',
      verificationNote: 'Authoritative government registry match',
      verifiedBy: registrar._id,
      verifiedAt: new Date(),
    });

    const doc2 = await TLDocument.create({
      ownerId: buyer._id,
      propertyId: prop._id,
      docType: 'Title Deed',
      originalFileName: 'tampered_deed_example.pdf',
      storagePath: './uploads/demo-doc-002.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 892100,
      originalHash: 'aabbcc112233deadbeef009900112233445566778899aabbccddeeff00112233',
      ocrExtractedText: 'PROPERTY DEED\nParcel: GLR-GB-FAKE\nLand Registry Verification: http://land-registry-clone.com/verify?id=XZ91',
      ocrStatus: 'completed',
      verificationStatus: 'tampered',
      verificationNote: 'Tampered deed flagged by zero-trust URL scanner',
    });

    await URLScanResult.create({
      documentId: doc2._id,
      url: 'http://land-registry-clone.com/verify?id=XZ91',
      isSafe: false,
      riskScore: 92,
      riskReasons: ['Non-HTTPS protocol detected', 'Lookalike domain mimicking official land registry: land-registry-clone.com'],
      hostname: 'land-registry-clone.com',
      scannedAt: new Date(),
    });

    // Transactions
    const tx = await Transaction.create({
      txId: 'TX-ESCROW-2026-8819',
      propertyId: prop._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      amount: 485000,
      escrowAmount: 509250,
      status: 'EscrowFunded',
      buyerApproved: true,
      sellerApproved: false,
      registrarApproved: false,
      onChainDealId: '0x' + crypto.createHash('sha256').update('TX-ESCROW-2026-8819').digest('hex'),
      escrowContractAddress: '0x0000000000000000000000000000000000000000',
    });

    // Audit Logs
    await AuditLog.insertMany([
      { actorId: null, actorEmail: 'system@trustledger.network', actorRole: 'system', action: 'SYSTEM_BOOT', entityType: 'System', entityId: new mongoose.Types.ObjectId(), metadata: { note: 'Auto-seeded baseline environment' }, timestamp: new Date(Date.now() - 3600000) },
      { actorId: buyer._id, actorEmail: buyer.email, actorRole: 'individual', action: 'IDENTITY_ONBOARDED', entityType: 'User', entityId: buyer._id, metadata: { did: buyer.did, kycTier: 'Tier 3 (Institutional)' }, timestamp: new Date(Date.now() - 3000000) },
      { actorId: registrar._id, actorEmail: registrar.email, actorRole: 'registrar', action: 'PROPERTY_REGISTERED', entityType: 'Property', entityId: prop._id, metadata: { registryNumber: 'GLR-GB-9821' }, timestamp: new Date(Date.now() - 2400000) },
      { actorId: buyer._id, actorEmail: buyer.email, actorRole: 'individual', action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: doc1._id, metadata: { fileName: doc1.originalFileName, verificationStatus: 'verified' }, timestamp: new Date(Date.now() - 1800000) },
      { actorId: buyer._id, actorEmail: buyer.email, actorRole: 'individual', action: 'TRANSACTION_CREATED', entityType: 'Transaction', entityId: tx._id, metadata: { txId: 'TX-ESCROW-2026-8819', amount: 485000 }, timestamp: new Date(Date.now() - 600000) },
    ]);

    // Smart Contracts
    await SmartContractRegistry.insertMany([
      { contractType: 'EntryPoint', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', network: 'localhost', chainId: 31337, abiRef: './artifacts/EntryPoint.json', deployedAt: new Date(), isActive: true },
      { contractType: 'AccountFactory', address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', network: 'localhost', chainId: 31337, abiRef: './artifacts/AccountFactory.json', deployedAt: new Date(), isActive: true },
      { contractType: 'Paymaster', address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', network: 'localhost', chainId: 31337, abiRef: './artifacts/Paymaster.json', deployedAt: new Date(), isActive: true },
      { contractType: 'PropertyRegistry', address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', network: 'localhost', chainId: 31337, abiRef: './artifacts/PropertyRegistry.json', deployedAt: new Date(), isActive: true },
      { contractType: 'Escrow', address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', network: 'localhost', chainId: 31337, abiRef: './artifacts/Escrow.json', deployedAt: new Date(), isActive: true },
    ]);

    console.log('✅ [DB] Automatic baseline seed completed across all 9 collections.');
  } catch (seedErr: any) {
    console.error('⚠️ [DB] Auto-seed error:', seedErr.message);
  }
}
