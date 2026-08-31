import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import { appendAuditLog } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, fullName, role } = req.body;
  const displayName = name || fullName;

  if (!email || !password || !displayName) {
    res.status(400).json({ success: false, error: 'email, password, and name are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: email.toLowerCase().trim(),
    name: displayName.trim(),
    passwordHash,
    role: role || 'individual',
  });

  await appendAuditLog({
    actorId: user._id as Types.ObjectId,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user._id as Types.ObjectId,
    metadata: { email: user.email, role: user.role },
  });

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      fullName: user.name,
      role: user.role,
      kycStatus: user.kycStatus,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'email and password required' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, did: user.did || undefined },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any
  );

  await appendAuditLog({
    actorId: user._id as Types.ObjectId,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user._id as Types.ObjectId,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      fullName: user.name,
      role: user.role,
      did: user.did,
      kycStatus: user.kycStatus,
      kycTier: user.kycTier,
      smartAccountAddress: user.smartAccountAddress,
    },
  });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id).select('-passwordHash').lean();
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, user: { ...user, fullName: user.name } });
}
