import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables SUPABASE_URL o SUPABASE_ANON_KEY en el entorno')
}

// Cliente público (respeta RLS) — para operaciones del usuario autenticado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente admin (bypassea RLS) — solo para scripts y Edge Functions de backend
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey ?? supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
