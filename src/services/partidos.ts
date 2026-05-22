import { supabaseAdmin } from '../lib/supabase'
import type { FasePartido, Partido, PartidoEnVivo } from '../types/database.types'

export async function getPartidosByFase(fase: FasePartido): Promise<
  (Partido & { equipo_local: { nombre_pais: string; codigo_iso: string }; equipo_visitante: { nombre_pais: string; codigo_iso: string } })[]
> {
  const { data, error } = await supabaseAdmin
    .from('partidos')
    .select(`
      *,
      equipo_local:equipos!equipo_local_id (nombre_pais, codigo_iso),
      equipo_visitante:equipos!equipo_visitante_id (nombre_pais, codigo_iso)
    `)
    .eq('fase', fase)
    .order('fecha_hora', { ascending: true })

  if (error) throw error
  return (data ?? []) as any
}

export async function getPartidosEnVivo(): Promise<PartidoEnVivo[]> {
  const { data, error } = await supabaseAdmin
    .from('partidos_en_vivo')
    .select('*')

  if (error) throw error
  return data ?? []
}

export async function getPartidoById(id: string): Promise<
  Partido & {
    equipo_local: { nombre_pais: string; codigo_iso: string; continente: string }
    equipo_visitante: { nombre_pais: string; codigo_iso: string; continente: string }
    playoff: { penales_local: number | null; penales_visitante: number | null; ganador_id: string | null } | null
  }
> {
  const { data, error } = await supabaseAdmin
    .from('partidos')
    .select(`
      *,
      equipo_local:equipos!equipo_local_id (nombre_pais, codigo_iso, continente),
      equipo_visitante:equipos!equipo_visitante_id (nombre_pais, codigo_iso, continente),
      playoff:playoffs (penales_local, penales_visitante, ganador_id)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as any
}
