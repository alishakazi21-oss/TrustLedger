import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

export type LitigationRisk = 'Low' | 'Medium' | 'High';
export type PropertyStatus = 'active' | 'disputed' | 'transferred';

/**
 * The `properties` collection is the canonical record for a parcel.
 * It always reflects the CURRENT state.
 * Historical changes live in `propertyVersions` (append-only).
 */
export interface IProperty extends Document {
  _id: Types.ObjectId;
  /** Government land registry number — globally unique */
  registryNumber: string;
  /** Pointer to the user who owns the property RIGHT NOW */
  currentOwnerId: Types.ObjectId;
  /**
   * GeoJSON Polygon / MultiPolygon representing the property boundary.
   * Stored as a flexible Mixed so arbitrary GeoJSON nesting is supported.
   */
  boundaryGeoJSON: Record<string, unknown> | null;
  /**
   * Free-form encumbrance strings, e.g.:
   * ["Mortgage: Barclays Bank £240,000 (2019)", "Easement: right of way"]
   */
  encumbrances: string[];
  litigationRiskScore: LitigationRisk;
  status: PropertyStatus;
  /** Pointer to the latest PropertyVersion document */
  currentVersionId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PropertySchema = new Schema<IProperty>(
  {
    registryNumber: {
      type: String,
      required: [true, 'registryNumber is required'],
      trim: true,
      uppercase: true,
    },
    currentOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'currentOwnerId is required'],
    },
    boundaryGeoJSON: {
      type: Schema.Types.Mixed,
      default: null,
    },
    encumbrances: {
      type: [String],
      default: [],
    },
    litigationRiskScore: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'] as LitigationRisk[],
        message: '{VALUE} is not a valid litigationRiskScore',
      },
      default: 'Low',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'disputed', 'transferred'] as PropertyStatus[],
        message: '{VALUE} is not a valid property status',
      },
      default: 'active',
    },
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyVersion',
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Registry number is the globally unique external identifier */
PropertySchema.index({ registryNumber: 1 }, { unique: true });

/** Fast lookup of all properties owned by a user */
PropertySchema.index({ currentOwnerId: 1, status: 1 });

/** Support geo-spatial queries when boundaryGeoJSON is a valid GeoJSON object */
PropertySchema.index({ boundaryGeoJSON: '2dsphere' }, { sparse: true });

/** Admin filtering by risk + status */
PropertySchema.index({ litigationRiskScore: 1, status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const Property = mongoose.model<IProperty>('Property', PropertySchema);
