import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  /** True once the initial session lookup has completed. */
  ready: boolean
  /** Loads the current session and subscribes to changes. Returns an unsubscribe fn. */
  init: () => () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Revoke every session for this user, everywhere. */
  signOutAll: () => Promise<void>
  /** Send a password-reset email that links back to the app. */
  resetPassword: (email: string) => Promise<void>
  /** Permanently delete the account and all its notes (irreversible). */
  deleteAccount: () => Promise<void>
  /** Update display name / avatar (stored in user_metadata). */
  updateProfile: (data: {
    full_name?: string
    avatar_url?: string
  }) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  ready: false,

  init: () => {
    void supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        ready: true,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, ready: true })
    })

    return () => subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  signOutAll: async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  },

  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_user')
    if (error) throw error
    await supabase.auth.signOut()
  },

  updateProfile: async (data) => {
    const { error } = await supabase.auth.updateUser({ data })
    if (error) throw error
  },

  updateEmail: async (email) => {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}))
