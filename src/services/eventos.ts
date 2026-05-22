import { supabaseAdmin } from '../lib/supabase'
import type { EventoPartido } from '../types/database.types'

export async function getEventosByPartido(partidoId: string): Promise<
  (EventoPartido & { equipo: { nombre_pais: string; codigo_iso: string } })[]
> {
  const { data, error } = await supabaseAdmin
    .from('eventos_partido')
    .select(`
      *,
      equipo:equipos (nombre_pais, codigo_iso)
    `)
    .eq('partido_id', partidoId)
    .order('minuto', { ascending: true })
    .order('minuto_extra', { ascending: true, nullsFirst: true })

  if (error) throw error
  return (data ?? []) as any
}
