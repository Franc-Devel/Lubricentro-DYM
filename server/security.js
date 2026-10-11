import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'bunker_omega_lubricentro_2026_secreto';
const LOCAL_ENCRYPTION_KEY = process.env.LOCAL_ENCRYPTION_KEY || 'ysjJ9-c5WB4hwiRWiPGujYjAucj9W5eM6b5JlpJ9b4g=';

// Password policy validator
export function validatePassword(password, username = '') {
  if (!password || password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }
}

// Bcrypt helpers
export function hashPassword(plainPassword) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

export function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

// Deterministic SHA-256 for indexed search (e.g. dni_hash)
export function hashField(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(String(text).trim()).digest('hex');
}

// Fernet Encrypt / Decrypt implementation compatible with Python cryptography.fernet
function getFernetKeys() {
  const rawKey = Buffer.from(LOCAL_ENCRYPTION_KEY, 'base64url');
  if (rawKey.length !== 32) {
    // Fallback if not 32 bytes
    const padded = Buffer.alloc(32);
    rawKey.copy(padded);
    return { signingKey: padded.subarray(0, 16), encryptKey: padded.subarray(16, 32) };
  }
  return {
    signingKey: rawKey.subarray(0, 16),
    encryptKey: rawKey.subarray(16, 32),
  };
}

export function decryptField(token) {
  if (!token || typeof token !== 'string') return '';
  if (!token.startsWith('gAAAA')) {
    // Not a Fernet token; return legacy plaintext directly
    return token;
  }
  try {
    const { signingKey, encryptKey } = getFernetKeys();
    const data = Buffer.from(token, 'base64url');
    if (data.length < 57) return token;

    const version = data[0];
    if (version !== 0x80) return token;

    const hmacReceived = data.subarray(data.length - 32);
    const signedData = data.subarray(0, data.length - 32);

    const calculatedHmac = crypto.createHmac('sha256', signingKey).update(signedData).digest();
    if (!crypto.timingSafeEqual(hmacReceived, calculatedHmac)) {
      console.warn('Fernet HMAC verification failed');
      return token;
    }

    const iv = data.subarray(9, 25);
    const ciphertext = data.subarray(25, data.length - 32);

    const decipher = crypto.createDecipheriv('aes-128-cbc', encryptKey, iv);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf-8');
  } catch (err) {
    console.warn('Error decrypting field, returning as-is:', err.message);
    return token;
  }
}

export function encryptField(text) {
  if (!text) return '';
  try {
    const { signingKey, encryptKey } = getFernetKeys();
    const iv = crypto.randomBytes(16);
    const timestampSec = Math.floor(Date.now() / 1000);
    const tsBuf = Buffer.alloc(8);
    tsBuf.writeBigUInt64BE(BigInt(timestampSec), 0);

    const cipher = crypto.createCipheriv('aes-128-cbc', encryptKey, iv);
    cipher.setAutoPadding(true);
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(String(text), 'utf-8')), cipher.final()]);

    const header = Buffer.concat([Buffer.from([0x80]), tsBuf, iv, ciphertext]);
    const hmac = crypto.createHmac('sha256', signingKey).update(header).digest();

    return Buffer.concat([header, hmac]).toString('base64url');
  } catch (err) {
    console.warn('Error encrypting field:', err.message);
    return text;
  }
}

// In-memory brute force throttling store
export const terminalThrottle = {
  counter: 0,
  blockedUntil: null,
};

export function checkTerminalThrottle() {
  if (terminalThrottle.blockedUntil && new Date() < terminalThrottle.blockedUntil) {
    const minutes = Math.ceil((terminalThrottle.blockedUntil - new Date()) / 60000);
    return `⚠️ Terminal bloqueada temporalmente por seguridad. Intente en ${minutes} minutos.`;
  }
  return null;
}

export function recordTerminalFailure() {
  terminalThrottle.counter += 1;
  if (terminalThrottle.counter >= 5) {
    terminalThrottle.blockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }
}

export function resetTerminalThrottle() {
  terminalThrottle.counter = 0;
  terminalThrottle.blockedUntil = null;
}

export { JWT_SECRET };
