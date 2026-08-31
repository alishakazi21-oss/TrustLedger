import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { connectDatabase } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import identityRoutes from './routes/identity';
import documentRoutes from './routes/documents';
import propertyRoutes from './routes/properties';
import transactionRoutes from './routes/transactions';
import bundlerRoutes from './routes/bundler';
import adminRoutes from './routes/admin';

// ─── Ensure upload directory exists ──────────────────────────────────────────
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Create Express app ───────────────────────────────────────────────────────
const app = express();

// ─── Security & logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TrustLedger API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/identity', identityRoutes);
app.use('/documents', documentRoutes);
app.use('/properties', propertyRoutes);
app.use('/transactions', transactionRoutes);
app.use('/bundler', bundlerRoutes);
app.use('/admin', adminRoutes);

// ─── 404 & Error handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║  TrustLedger API                                 ║
║  Environment : ${config.nodeEnv.padEnd(33)}║
║  Port        : ${String(config.port).padEnd(33)}║
║  MongoDB     : ${config.mongoUri.slice(0, 33).padEnd(33)}║
╚══════════════════════════════════════════════════╝
    `);
  });
}

main().catch((err) => {
  console.error('[BOOT] Fatal error:', err);
  process.exit(1);
});

export default app;
