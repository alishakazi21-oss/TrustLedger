import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type PropertyVersionStatus = 'Original' | 'Superseded' | 'Corrected';

/**
 * The `propertyVersions` collection is the **append-only** history ledger.
 *
 * Rules (enforced by application logic):
 *  1. Records are never updated or deleted once inserted.
 *  2. When a correction is made, a new document is inserted with:
 *       status = 'Corrected', previousVersionId = <prior version's _id>
 *  3. The prior version's status is then updated to 'Superseded' — the ONLY
 *     permitted write to an existing version document.
 *  4. `properties.currentVersionId` always points to the latest version.
 */
export interface IPropertyVersion extends Document {
  _id: Types.ObjectId;
  /** Reference to the canonical Property record */
  propertyId: Types.ObjectId;
  /** 1-based, monotonically increasing per property */
  versionNumber: number;
  status: PropertyVersionStatus;
  /**
   * Self-referential ref to the previous version.
   * Null on the very first (Original) version.
   */
  previousVersionId: Types.ObjectId | null;
  /** Who owned the property at the time this version was recorded */
  ownerIdAtVersion: Types.ObjectId;
  /** Human-readable reason for this amendment / correction */
  changeReason: string | null;
  /**
   * Additional fields captured at the time of the version snapshot.
   * Stored here so the version chain is a complete self-contained record.
   */
  snapshotData: {
    title?: string;
    address?: string;
    parcelId?: string;
    zoning?: string;
    sqFt?: string;
    deedHash?: string;
    encumbrances?: string[];
    litigationRiskScore?: 'Low' | 'Medium' | 'High';
  };
  /** TX hash on the EVM chain when this version was anchored on-chain */
  onChainTxHash: string | null;
  /** Block number where the on-chain anchor landed */
  onChainBlockNumber: number | null;
  /** The registrar or admin who recorded this version */
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PropertyVersionSchema = new Schema<IPropertyVersion>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'propertyId is required'],
    },
    versionNumber: {
      type: Number,
      required: [true, 'versionNumber is required'],
      min: [1, 'versionNumber must be ≥ 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['Original', 'Superseded', 'Corrected'] as PropertyVersionStatus[],
        message: '{VALUE} is not a valid version status',
      },
      required: [true, 'status is required'],
    },
    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyVersion',
      default: null,
    },
    ownerIdAtVersion: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ownerIdAtVersion is required'],
    },
    changeReason: {
      type: String,
      default: null,
      trim: true,
    },
    snapshotData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    onChainTxHash: { type: String, default: null },
    onChainBlockNumber: { type: Number, default: null },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'recordedBy is required'],
    },
    recordedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * CORE INDEX — fetch the full version chain for a property in order.
 * Unique on (propertyId, versionNumber) prevents duplicate version numbers
 * per property, enforcing the monotonically-increasing invariant.
 */
PropertyVersionSchema.index(
  { propertyId: 1, versionNumber: 1 },
  { unique: true }
);

/**
 * CHAIN TRAVERSAL — given a version document, quickly find the next one
 * that references it as previousVersionId.
 */
PropertyVersionSchema.index({ previousVersionId: 1 }, { sparse: true });

/** Filter: "show me all versions that are still 'Original' (never amended)" */
PropertyVersionSchema.index({ propertyId: 1, status: 1 });

/** On-chain anchor lookup */
PropertyVersionSchema.index({ onChainTxHash: 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────

export const PropertyVersion = mongoose.model<IPropertyVersion>(
  'PropertyVersion',
  PropertyVersionSchema
);
