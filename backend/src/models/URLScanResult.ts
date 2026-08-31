import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export interface IURLScanResult extends Document {
  _id: Types.ObjectId;
  /** The document this URL was extracted from */
  documentId: Types.ObjectId;
  /** The full URL found in the document (or supplied directly) */
  url: string;
  isSafe: boolean;
  /**
   * 0–100, where 0 = clean and 100 = highest risk.
   * Populated by the heuristic scanner; easy to replace with a real
   * threat-intel feed later.
   */
  riskScore: number;
  /** Structured reasons for the risk score */
  riskReasons: string[];
  /**
   * Resolved hostname, stored separately so you can aggregate
   * "how many documents contained links to attacker.com"
   */
  hostname: string | null;
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const URLScanResultSchema = new Schema<IURLScanResult>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'documentId is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'url is required'],
      trim: true,
      maxlength: [2048, 'url must be ≤ 2048 characters'],
    },
    isSafe: {
      type: Boolean,
      required: [true, 'isSafe is required'],
    },
    riskScore: {
      type: Number,
      required: [true, 'riskScore is required'],
      min: [0, 'riskScore must be ≥ 0'],
      max: [100, 'riskScore must be ≤ 100'],
    },
    riskReasons: {
      type: [String],
      default: [],
    },
    hostname: {
      type: String,
      default: null,
    },
    scannedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Fetch all scan results for a document */
URLScanResultSchema.index({ documentId: 1, scannedAt: -1 });

/** Threat-intel aggregation: "all unsafe results for a given hostname" */
URLScanResultSchema.index({ hostname: 1, isSafe: 1 });

/** Admin view: most recently flagged unsafe URLs across all documents */
URLScanResultSchema.index({ isSafe: 1, riskScore: -1, scannedAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const URLScanResult = mongoose.model<IURLScanResult>('URLScanResult', URLScanResultSchema);
