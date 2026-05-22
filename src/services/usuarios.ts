import { supabaseAdmin } from '../lib/supabase'
import type { Usuario } from '../types/database.types'

export async function getUsuario(id: string): Promise<Usuario | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updatePerfil(
  id: string,
  updates: { nombre?: string; avatar_url?: string | null }
): Promise<Usuario> {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
