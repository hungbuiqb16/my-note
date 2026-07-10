import { create } from 'zustand'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/store/auth'
import {
  b64decode,
  b64encode,
  checkVerifier,
  decryptString,
  deriveKey,
  encryptString,
  makeVerifier,
  randomBytes,
} from '@/utils/crypto'

interface VaultMeta {
  salt: string
  verifier: string
}

interface VaultState {
  /** In-memory master key; null while locked. Never persisted. */
  key: CryptoKey | null
  /** Vault metadata (salt + verifier) loaded from the `vaults` table. */
  meta: VaultMeta | null
  loaded: boolean
  /** Load this user's vault metadata (call after login). */
  loadMeta: () => Promise<void>
  /** Clear key + metadata (call on logout). */
  reset: () => void
  hasVault: () => boolean
  /** Create the vault passphrase (first time) and unlock. */
  setup: (passphrase: string) => Promise<void>
  /** Verify passphrase against the stored verifier and unlock. */
  unlock: (passphrase: string) => Promise<void>
  lock: () => void
  encrypt: (text: string) => Promise<string>
  decrypt: (blob: string) => Promise<string>
}

export const useVault = create<VaultState>((set, get) => ({
  key: null,
  meta: null,
  loaded: false,

  loadMeta: async () => {
    const userId = useAuth.getState().user?.id
    if (!userId) {
      set({ meta: null, loaded: true })
      return
    }
    const { data, error } = await supabase
      .from('vaults')
      .select('salt, verifier')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      set({ loaded: true })
      return
    }
    set({
      meta: data ? { salt: data.salt, verifier: data.verifier } : null,
      loaded: true,
    })
  },

  reset: () => set({ key: null, meta: null, loaded: false }),

  hasVault: () => get().meta !== null,

  setup: async (passphrase) => {
    const userId = useAuth.getState().user?.id
    if (!userId) throw new Error('Chưa đăng nhập')
    const salt = randomBytes(16)
    const key = await deriveKey(passphrase, salt)
    const meta: VaultMeta = {
      salt: b64encode(salt),
      verifier: await makeVerifier(key),
    }
    const { error } = await supabase
      .from('vaults')
      .upsert({ user_id: userId, salt: meta.salt, verifier: meta.verifier })
    if (error) throw error
    set({ key, meta })
  },

  unlock: async (passphrase) => {
    if (!get().meta) await get().loadMeta()
    const meta = get().meta
    if (!meta) throw new Error('Chưa thiết lập bảo mật')
    const key = await deriveKey(passphrase, b64decode(meta.salt))
    if (!(await checkVerifier(key, meta.verifier))) {
      throw new Error('Sai mật khẩu bảo mật')
    }
    set({ key })
  },

  lock: () => set({ key: null }),

  encrypt: async (text) => {
    const { key } = get()
    if (!key) throw new Error('Vault chưa mở khóa')
    return encryptString(key, text)
  },

  decrypt: async (blob) => {
    const { key } = get()
    if (!key) throw new Error('Vault chưa mở khóa')
    return decryptString(key, blob)
  },
}))
