import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type AuditEntityType =
  | 'User'
  | 'Credential'
  | 'Document'
  | 'URLScanResult'
  | 'Property'
  | 'PropertyVersion'
  | 'Transaction'
  | 'SmartContractRegistry'
  | 'Paymaster'
  | 'System';

/**
 * `auditLogs` is an **append-only** collection.
 * Application code must NEVER update or delete a log entry.
 * TTL is intentionally not set — these are permanent compliance records.
 */
export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  /**
   * Who triggered the action.
   * Use the string "system" for automated/background jobs.
   */
  actorId: Types.ObjectId | null;
  actorEmail: string | null;
  actorRole: string;
  /** Verb describing what happened, e.g. "DOCUMENT_VERIFIED" */
  action: string;
  entityType: AuditEntityType;
  /**
   * ObjectId of the affected record, stored as ObjectId so Mongoose
   * can populate() it and you can build cross-collection join queries.
   */
  entityId: Types.ObjectId;
  /**
   * Flexible bag of additional context — diff values, previous status,
   * on-chain tx hashes, etc.  Not indexed; used for display only.
   */
  metadata: Record<string, unknown>;
  /** If the action produced an on-chain transaction */
  onChainTxHash: string | null;
  /** Client IP for security auditing */
  ipAddress: string | null;
  timestamp: Date;
  // No updatedAt — these records are write-once
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorEmail: { type: String, default: null },
    actorRole: { type: String, required: [true, 'actorRole is required'] },
    action: { type: String, required: [true, 'action is required'], trim: true },
    entityType: {
      type: String,
      enum: {
        values: [
          'User',
          'Credential',
          'Document',
          'URLScanResult',
          'Property',
          'PropertyVersion',
          'Transaction',
          'SmartContractRegistry',
          'Paymaster',
          'System',
        ] as AuditEntityType[],
        message: '{VALUE} is not a valid entityType',
      },
      required: [true, 'entityType is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'entityId is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    onChainTxHash: { type: String, default: null },
    ipAddress: { type: String, default: null },
    timestamp: {
      type: Date,
      default: () => new Date(),
      immutable: true, // prevent accidental updates via Mongoose middleware
    },
  },
  {
    // Only createdAt — no updatedAt, because these records are write-once
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY INDEX — as specified:
 * { entityType, entityId, timestamp } powers:
 *   - "ownership history" view (query by entityType=Property, entityId=propId)
 *   - "recent activity" view (same query sorted by -timestamp)
 *   - per-document audit trail
 *   - per-user audit trail
 */
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

/**
 * ACTOR HISTORY — "show me all actions performed by admin X"
 * Sparse because actorId is null for system-generated entries.
 */
AuditLogSchema.index({ actorId: 1, timestamp: -1 }, { sparse: true });

/** Admin dashboard: recent activity feed across all entity types */
AuditLogSchema.index({ timestamp: -1 });

/** Compliance filter: "show all DOCUMENT_VERIFIED events in date range" */
AuditLogSchema.index({ action: 1, timestamp: -1 });

/** On-chain event correlation */
AuditLogSchema.index({ onChainTxHash: 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
