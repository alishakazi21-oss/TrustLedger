import crypto from 'crypto';
import fs from 'fs';
import { createWorker } from 'tesseract.js';

/**
 * Compute SHA-256 hash of a file on disk.
 */
export async function computeFileSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (d) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Extract text from an image or PDF using Tesseract.js OCR.
 */
export async function runOCR(filePath: string): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(filePath);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Simulated government registry cross-check.
 * In production this would call an actual registry API.
 * Returns match/mismatch based on seeded fake records.
 */
const FAKE_REGISTRY: Record<string, { parcelId: string; owner: string; sha256: string }> = {
  'GLR-GB-9821': {
    parcelId: 'GLR-GB-9821',
    owner: 'Helena Vance-Croft',
    sha256: '9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
  },
  'GLR-GB-4019': {
    parcelId: 'GLR-GB-4019',
    owner: 'Alexander Sterling',
    sha256: '88bb19023412a819c991823901af837499120938475891238491029384758192',
  },
};

export interface RegistryCrossCheckResult {
  status: 'match' | 'mismatch' | 'not_found';
  matchedParcelId?: string;
  matchedOwner?: string;
  discrepancies?: string[];
}

export function crossCheckRegistry(
  sha256Hash: string,
  ocrText: string
): RegistryCrossCheckResult {
  const truncated = sha256Hash.slice(0, 10);

  // Check if hash prefix matches any known registry entry
  for (const [parcelId, record] of Object.entries(FAKE_REGISTRY)) {
    if (record.sha256.startsWith(truncated) || ocrText.includes(parcelId)) {
      return {
        status: 'match',
        matchedParcelId: record.parcelId,
        matchedOwner: record.owner,
      };
    }
  }

  // Simulate a mismatch if OCR finds suspicious keywords
  if (
    ocrText.toLowerCase().includes('forged') ||
    ocrText.toLowerCase().includes('tampered') ||
    ocrText.toLowerCase().includes('fake')
  ) {
    return {
      status: 'mismatch',
      discrepancies: ['Suspicious content detected in OCR text', 'Hash not found in registry'],
    };
  }

  return { status: 'not_found' };
}
