import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { uploadDocument, getDocumentStatus, revokeDocument } from '../controllers/documentController';
import { authenticate, requireRole } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|tiff/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, PDF, and TIFF files are allowed'));
    }
  },
});

const router = Router();

// All document routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentStatus);
router.post('/:id/revoke', requireRole('issuer', 'admin', 'registrar'), revokeDocument);

export default router;
