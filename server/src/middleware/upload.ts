import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store uploads strictly outside web root
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Memory storage so we can inspect magic bytes & strip EXIF before writing to disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
    files: 2,
  },
});

export interface ValidatedFile {
  originalName: string;
  savedFileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  mediaType: 'photo' | 'audio';
}

function verifyMagicBytes(buffer: Buffer): { isValid: boolean; mime: string; type: 'photo' | 'audio' } {
  if (buffer.length < 8) return { isValid: false, mime: '', type: 'photo' };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, mime: 'image/jpeg', type: 'photo' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { isValid: true, mime: 'image/png', type: 'photo' };
  }

  // WEBP / WAV: RIFF header (52 49 46 46)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    const subType = buffer.toString('ascii', 8, 12);
    if (subType === 'WEBP') {
      return { isValid: true, mime: 'image/webp', type: 'photo' };
    }
    if (subType === 'WAVE') {
      return { isValid: true, mime: 'audio/wav', type: 'audio' };
    }
  }

  // MP3: ID3 or FF FB
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { isValid: true, mime: 'audio/mp3', type: 'audio' };
  }
  if (buffer[0] === 0xFF && (buffer[1] === 0xFB || buffer[1] === 0xF3 || buffer[1] === 0xF2)) {
    return { isValid: true, mime: 'audio/mp3', type: 'audio' };
  }

  // OGG: 4F 67 67 53 (OggS)
  if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { isValid: true, mime: 'audio/ogg', type: 'audio' };
  }

  // WEBM: 1A 45 DF A3
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return { isValid: true, mime: 'audio/webm', type: 'audio' };
  }

  return { isValid: false, mime: '', type: 'photo' };
}

/**
 * Strips EXIF APP1 metadata from JPEG buffers
 */
function stripJpegExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return buffer;
  }

  let offset = 2;
  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Start of Image (SOI)

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];

    if (marker === 0xDA) { // Start of Scan (SOS) - image payload begins
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (offset + 4 > buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);

    // APP1 marker (0xE1) usually holds EXIF metadata
    if (marker !== 0xE1) {
      chunks.push(buffer.subarray(offset, offset + 2 + length));
    }

    offset += 2 + length;
  }

  return Buffer.concat(chunks);
}

export function processAndSaveFile(file: Express.Multer.File): ValidatedFile {
  const verified = verifyMagicBytes(file.buffer);

  if (!verified.isValid) {
    throw new Error(`File ${file.originalname} has unrecognized magic bytes signature.`);
  }

  if (verified.type === 'photo' && file.size > 5 * 1024 * 1024) {
    throw new Error('Photo files must be under 5 MB.');
  }
  if (verified.type === 'audio' && file.size > 8 * 1024 * 1024) {
    throw new Error('Audio voice notes must be under 8 MB.');
  }

  let processedBuffer = file.buffer;
  if (verified.mime === 'image/jpeg') {
    processedBuffer = stripJpegExif(processedBuffer);
  }

  const ext = verified.mime.split('/')[1] || 'bin';
  const randomName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const targetPath = path.join(UPLOAD_DIR, randomName);

  fs.writeFileSync(targetPath, processedBuffer);

  return {
    originalName: file.originalname,
    savedFileName: randomName,
    filePath: targetPath,
    mimeType: verified.mime,
    size: processedBuffer.length,
    mediaType: verified.type,
  };
}
