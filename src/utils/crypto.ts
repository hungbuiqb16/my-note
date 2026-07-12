// Client-side encryption helpers (Web Crypto): PBKDF2 key derivation + AES-GCM.
// The server never sees the passphrase or the derived key.

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const PBKDF2_ITERATIONS = 150_000
const VERIFIER_TEXT = 'hnote-vault-v1'

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

export function b64encode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function b64decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Encrypt a string → "ivBase64:cipherBase64". */
export async function encryptString(
  key: CryptoKey,
  plaintext: string,
): Promise<string> {
  const iv = randomBytes(12)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(plaintext) as BufferSource,
  )
  return `${b64encode(iv)}:${b64encode(new Uint8Array(cipher))}`
}

/** Decrypt "ivBase64:cipherBase64" → string (throws if key/data is wrong). */
export async function decryptString(
  key: CryptoKey,
  blob: string,
): Promise<string> {
  const [ivB64, cipherB64] = (blob ?? '').split(':')
  if (!ivB64 || !cipherB64) throw new Error('Dữ liệu mã hóa không hợp lệ')
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64decode(ivB64) as BufferSource },
    key,
    b64decode(cipherB64) as BufferSource,
  )
  return decoder.decode(plain)
}

/** A small ciphertext used to verify a passphrase without storing it. */
export async function makeVerifier(key: CryptoKey): Promise<string> {
  return encryptString(key, VERIFIER_TEXT)
}

export async function checkVerifier(
  key: CryptoKey,
  verifier: string,
): Promise<boolean> {
  try {
    return (await decryptString(key, verifier)) === VERIFIER_TEXT
  } catch {
    return false
  }
}
