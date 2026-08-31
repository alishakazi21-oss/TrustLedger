import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type UserRole = 'individual' | 'issuer' | 'verifier' | 'registrar' | 'admin';
export type KycStatus = 'pending' | 'verified' | 'rejected';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  /** Null until the user completes identity onboarding */
  did: string | null;
  kycStatus: KycStatus;
  /** Tier label e.g. "Tier 3 (Institutional)" */
  kycTier: string;
  /** EOA wallet address — set during identity onboarding */
  eoa: string | null;
  /** Counterfactual ERC-4337 SmartAccount address */
  smartAccountAddress: string | null;
  /** SHA-256(nationalId + dob + salt) — never store the raw NID */
  nationalIdHash: string | null;
  /** Reputation score 0–100 */
  reputationScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      maxlength: [200, 'name must be ≤ 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'passwordHash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['individual', 'issuer', 'verifier', 'registrar', 'admin'] as UserRole[],
        message: '{VALUE} is not a valid role',
      },
      default: 'individual',
    },
    did: {
      type: String,
      default: null,
    },
    kycStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'] as KycStatus[],
        message: '{VALUE} is not a valid kycStatus',
      },
      default: 'pending',
    },
    kycTier: {
      type: String,
      default: 'Tier 0 (Unverified)',
    },
    eoa: { type: String, default: null },
    smartAccountAddress: { type: String, default: null },
    nationalIdHash: { type: String, default: null },
    reputationScore: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    // Virtuals are not included in toJSON/toObject by default
    toJSON: { virtuals: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Unique email — the primary login key */
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Sparse unique on DID — null users are excluded from the index,
 * so multiple unverified users can co-exist before onboarding.
 */
UserSchema.index({ did: 1 }, { unique: true, sparse: true });

/** Support filtering by role + kycStatus in admin views */
UserSchema.index({ role: 1, kycStatus: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const User = mongoose.model<IUser>('User', UserSchema);
