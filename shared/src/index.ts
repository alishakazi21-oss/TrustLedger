// Shared Types for TrustLedger (Backend, Contracts, and Frontend)

export type UserRole = 'individual' | 'issuer' | 'verifier' | 'registrar' | 'admin';

export interface UserOperation {
  sender: string;
  nonce: string | number | bigint;
  initCode: string;
  callData: string;
  callGasLimit: string | number | bigint;
  verificationGasLimit: string | number | bigint;
  preVerificationGas: string | number | bigint;
  maxFeePerGas: string | number | bigint;
  maxPriorityFeePerGas: string | number | bigint;
  paymasterAndData: string;
  signature: string;
}

export interface DIDDocument {
  id: string; // e.g. did:ethr:0x123...
  controller: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyHex?: string;
    blockchainAccountId?: string;
  }[];
  authentication: string[];
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string; // DID
    fullName: string;
    nationalIdHash: string;
    kycTier: string;
    isVerified: boolean;
    attributes?: Record<string, any>;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    signatureValue?: string;
  };
}

export type PropertyVersionStatus = 'Original' | 'Superseded' | 'Corrected';

export interface PropertyVersion {
  versionId: string;
  propertyId: string;
  versionNumber: number;
  status: PropertyVersionStatus;
  previousVersionId?: string | null;
  ownerId: string;
  ownerDid: string;
  title: string;
  address: string;
  parcelId: string;
  zoning: string;
  sqFt: string;
  cadastralCoordinates: string;
  boundaryGeoJson?: Record<string, any>;
  deedHash: string;
  riskScore: number; // 0-100 (0=high risk, 100=clean)
  riskStatus: 'Low' | 'Medium' | 'High';
  riskDetails: string;
  onChainTxHash?: string;
  onChainBlockNumber?: number;
  recordedBy: string;
  recordedAt: string;
  amendmentReason?: string;
}

export type TransactionStatus =
  | 'Offered'
  | 'EscrowFunded'
  | 'Verifying'
  | 'ContractExecuted'
  | 'TitleTransferred'
  | 'Cancelled'
  | 'Refunded';

export interface TransactionRecord {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerId: string;
  buyerDid: string;
  sellerId: string;
  sellerDid: string;
  escrowAmountUsd: number;
  priceUsd: number;
  status: TransactionStatus;
  userOpHash?: string;
  onChainTxHash?: string;
  escrowAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id?: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  entityType: 'User' | 'Document' | 'Property' | 'Transaction' | 'Paymaster';
  entityId: string;
  details?: Record<string, any>;
  onChainTxHash?: string;
  timestamp: string;
}
