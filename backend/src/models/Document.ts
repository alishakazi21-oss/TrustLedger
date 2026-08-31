import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type DocumentVerificationStatus = 'pending' | 'verified' | 'tampered' | 'revoked';

export interface ITLDocument extends Document {
  _id: Types.ObjectId;
  /** The user who uploaded this document */
  ownerId: Types.ObjectId;
  /** Optional: documents can be attached to a specific property */
  propertyId: Types.ObjectId | null;
  /** e.g. "National ID", "Title Deed", "Mortgage Certificate" */
  docType: string;
  /** Original filename preserved for display */
  originalFileName: string;
  /** Local storage path or cloud key */
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  /**
   * SHA-256 of the file bytes at upload time.
   * Unique index — re-uploading the exact same file is rejected.
   */
  originalHash: string;
  /** Text extracted by OCR (tesseract.js) */
  ocrExtractedText: string | null;
  ocrStatus: 'pending' | 'completed' | 'failed';
  /** IPFS CID — null until pinned */
  ipfsCid: string | null;
  verificationStatus: DocumentVerificationStatus;
  /** Reason set when verificationStatus is 'tampered' or 'revoked' */
  verificationNote: string | null;
  /** Who performed the final verification action */
  verifiedBy: Types.ObjectId | null;
  verifiedAt: Date | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const TLDocumentSchema = new Schema<ITLDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ownerId is required'],
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    docType: {
      type: String,
      required: [true, 'docType is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'originalFileName is required'],
      trim: true,
    },
    storagePath: {
      type: String,
      required: [true, 'storagePath is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'mimeType is required'],
    },
    fileSizeBytes: {
      type: Number,
      required: [true, 'fileSizeBytes is required'],
      min: [1, 'fileSizeBytes must be > 0'],
    },
    originalHash: {
      type: String,
      required: [true, 'originalHash is required'],
    },
    ocrExtractedText: { type: String, default: null },
    ocrStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    ipfsCid: { type: String, default: null },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'tampered', 'revoked'] as DocumentVerificationStatus[],
        message: '{VALUE} is not a valid verificationStatus',
      },
      default: 'pending',
    },
    verificationNote: { type: String, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY — as specified:
 * Unique on { originalHash } prevents duplicate document uploads.
 * If the same file is re-uploaded its hash collides and the insert fails.
 */
TLDocumentSchema.index({ originalHash: 1 }, { unique: true });

/** Support fetching all docs for a property or an owner in one query */
TLDocumentSchema.index({ ownerId: 1, verificationStatus: 1 });
TLDocumentSchema.index({ propertyId: 1 }, { sparse: true });

/** Allow querying pending verification work queue */
TLDocumentSchema.index({ verificationStatus: 1, uploadedAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const TLDocument = mongoose.model<ITLDocument>('Document', TLDocumentSchema);
