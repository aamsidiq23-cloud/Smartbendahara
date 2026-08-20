import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User as AuthUser, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { UserProfile } from './database.types'

// ============================================
// Auth Context Types
// ============================================
interface AuthState {
  /** Supabase auth user */
  authUser: AuthUser | null
  /** Supabase session (contains JWT) */
  session: Session | null
  /** App user profile (from our users + tenants tables) */
  profile: UserProfile | null
  /** True while initial session check or profile loading */
  loading: boolean
  /** True if there was an error loading the profile */
  error: string | null
}

interface AuthContextValue extends AuthState {
  /** Sign in with email + password */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  /** Sign up with email + password, then create tenant + user */
  signUp: (
    email: string,
    password: string,
    schoolName: string,
    adminName: string,
  ) => Promise<{ error: AuthError | Error | null }>
  /** Sign out and clear session */
  signOut: () => Promise<void>
  /** Reload user profile from database */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================
// AuthProvider Component
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authUser: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  })

  // Fetch user profile from our database
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.rpc('get_user_profile' as any)
      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      return data as unknown as UserProfile
    } catch (err) {
      console.error('Exception fetching profile:', err)
      return null
    }
  }, [])

  // Load profile and update state
  const refreshProfile = useCallback(async () => {
    const profile = await fetchProfile()
    setState((prev) => ({ ...prev, profile }))
  }, [fetchProfile])

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile()
        setState({
          authUser: session.user,
          session,
          profile,
          loading: false,
          error: null,
        })
      } else {
        setState({
          authUser: null,
          session: null,
          profile: null,
          loading: false,
          error: null,
        })
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile()
        setState({
          authUser: session.user,
          session,
          profile,
          loading: false,
          error: null,
        })
      } else if (event === 'SIGNED_OUT') {
        setState({
          authUser: null,
          session: null,
          profile: null,
          loading: false,
          error: null,
        })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState((prev) => ({ ...prev, session, authUser: session.user }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ============================================
  // Auth Actions
  // ============================================

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
    }
    // On success, onAuthStateChange will handle state update

    return { error }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, schoolName: string, adminName: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // 1. Create auth user with metadata
      // The database trigger (on_auth_user_created) will automatically
      // create the tenant + app user when the auth user is created
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            school_name: schoolName,
            admin_name: adminName,
          },
        },
      })

      if (authError) {
        setState((prev) => ({ ...prev, loading: false, error: authError.message }))
        return { error: authError }
      }

      if (!authData.user) {
        const err = new Error('Registrasi gagal: user tidak dibuat')
        setState((prev) => ({ ...prev, loading: false, error: err.message }))
        return { error: err }
      }

      // 2. If no session returned, email confirmation is required
      // The trigger on auth.users should have already created the tenant
      // If session IS present (auto-confirm enabled), also try RPC as fallback
      if (authData.session) {
        // User was auto-confirmed, try to create tenant via RPC as fallback
        // (in case the trigger didn't fire)
        try {
          const { error: rpcError } = await (supabase as any).rpc('handle_new_registration', {
            p_school_name: schoolName,
            p_admin_name: adminName,
            p_email: email,
            p_auth_id: authData.user.id,
          })
          // Ignore duplicate errors — trigger may have already created the records
          if (rpcError && !rpcError.message?.includes('duplicate')) {
            console.warn('RPC handle_new_registration warning:', rpcError.message)
          }
        } catch (e) {
          console.warn('RPC fallback warning:', e)
        }
      }

      // Note: Profile will be loaded after email verification & first login
      setState((prev) => ({ ...prev, loading: false }))
      return { error: null }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // onAuthStateChange will handle state cleanup
  }, [])

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================
// useAuth Hook
// ============================================
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
