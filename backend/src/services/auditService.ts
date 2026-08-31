import { Types } from 'mongoose';
import { AuditLog, AuditEntityType } from '../models/AuditLog';

interface LogParams {
  actorId?: Types.ObjectId | string | null;
  actorEmail?: string | null;
  actorRole: string;
  action: string;
  entityType: AuditEntityType;
  entityId: Types.ObjectId | string;
  metadata?: Record<string, any>;
  onChainTxHash?: string | null;
  ipAddress?: string | null;
}

export async function appendAuditLog(params: LogParams): Promise<void> {
  try {
    const actorId =
      params.actorId && typeof params.actorId === 'string'
        ? new Types.ObjectId(params.actorId)
        : (params.actorId as Types.ObjectId | null);

    const entityId =
      typeof params.entityId === 'string'
        ? new Types.ObjectId(params.entityId)
        : params.entityId;

    await AuditLog.create({
      actorId,
      actorEmail: params.actorEmail || null,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId,
      metadata: params.metadata || {},
      onChainTxHash: params.onChainTxHash || null,
      ipAddress: params.ipAddress || null,
    });
  } catch (err) {
    // Audit logs must never crash the main request path
    console.error('[AUDIT] Failed to write audit log:', err);
  }
}

export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: Types.ObjectId | string,
  limit = 50
) {
  const targetId = typeof entityId === 'string' ? new Types.ObjectId(entityId) : entityId;
  return AuditLog.find({ entityType, entityId: targetId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}
