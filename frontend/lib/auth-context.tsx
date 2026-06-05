'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const noRemember = typeof localStorage !== 'undefined' && localStorage.getItem('prode_no_remember') === '1'
      const activeSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('prode_active') === '1'
      if (data.session && noRemember && !activeSession) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        if (data.session && typeof sessionStorage !== 'undefined') sessionStorage.setItem('prode_active', '1')
        setUser(data.session?.user ?? null)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('prode_no_remember')
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('prode_active')
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}