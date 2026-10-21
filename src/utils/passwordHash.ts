const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const ALGORITHM = 'SHA-256';

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const len = hex.length / 2;
  const buf = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    buf[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return buf;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return `pbkdf2:${ITERATIONS}:${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2:')) {
    return plain === stored;
  }

  const parts = stored.split(':');
  const [, iterStr, saltHex, storedHash] = parts;
  if (!iterStr || !saltHex || !storedHash) return false;

  const iterations = parseInt(iterStr, 10);
  const salt = hexToBuffer(saltHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return bufferToHex(derivedBits) === storedHash;
}
