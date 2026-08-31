import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type CredentialStatus = 'active' | 'revoked';

export interface ICredential extends Document {
  _id: Types.ObjectId;
  /** The user who holds this credential */
  userId: Types.ObjectId;
  /** W3C DID of the credential subject */
  did: string;
  /** e.g. "TrustLedgerKYCCredential", "PropertyOwnershipCredential" */
  credentialType: string;
  /** DID of the issuing authority */
  issuer: string;
  issuedAt: Date;
  /** ISO 8601 expiry — null means no expiry */
  expiresAt: Date | null;
  status: CredentialStatus;
  /**
   * SHA-256 of the canonical JSON-LD credential payload.
   * Used for tamper-detection without storing the full VC body here.
   */
  credentialHash: string;
  /** Full W3C Verifiable Credential payload — optional for storage */
  credentialPayload?: Record<string, unknown>;
  /** Reason provided when status is set to 'revoked' */
  revocationReason: string | null;
  revokedAt: Date | null;
  revokedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CredentialSchema = new Schema<ICredential>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    did: {
      type: String,
      required: [true, 'did is required'],
      trim: true,
    },
    credentialType: {
      type: String,
      required: [true, 'credentialType is required'],
      trim: true,
    },
    issuer: {
      type: String,
      required: [true, 'issuer DID is required'],
      trim: true,
    },
    issuedAt: {
      type: Date,
      required: [true, 'issuedAt is required'],
      default: () => new Date(),
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'revoked'] as CredentialStatus[],
        message: '{VALUE} is not a valid credential status',
      },
      default: 'active',
    },
    credentialHash: {
      type: String,
      required: [true, 'credentialHash is required'],
    },
    credentialPayload: {
      type: Schema.Types.Mixed,
    },
    revocationReason: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY LOOKUP INDEX — as specified:
 * { did, status } supports "is this credential still active for this DID?"
 */
CredentialSchema.index({ did: 1, status: 1 });

/** Unique constraint: one credential hash must appear at most once */
CredentialSchema.index({ credentialHash: 1 }, { unique: true });

/** Range queries: fetch all credentials of a given type for a user */
CredentialSchema.index({ userId: 1, credentialType: 1, status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const Credential = mongoose.model<ICredential>('Credential', CredentialSchema);
