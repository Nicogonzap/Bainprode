import { supabaseAdmin } from '../lib/supabase'
import type { GrupoTorneo, UsuarioGrupo } from '../types/database.types'

function generarCodigo(longitud = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: longitud }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export async function getTorneosDeUsuario(usuarioId: string): Promise<
  (GrupoTorneo & { puntos_total: number; posicion: number | null })[]
> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_grupos')
    .select(`
      puntos_total,
      grupos_torneo (*)
    `)
    .eq('usuario_id', usuarioId)

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    ...row.grupos_torneo,
    puntos_total: row.puntos_total,
    posicion: null,
  }))
}

export async function createTorneo(
  creadorId: string,
  nombre: string,
  opciones?: { maxParticipantes?: number; esPublico?: boolean }
): Promise<GrupoTorneo> {
  const codigo = generarCodigo()

  const { data: grupo, error: grupoError } = await supabaseAdmin
    .from('grupos_torneo')
    .insert({
      nombre,
      codigo_invitacion: codigo,
      creador_id: creadorId,
      max_participantes: opciones?.maxParticipantes ?? null,
      es_publico: opciones?.esPublico ?? false,
    })
    .select()
    .single()

  if (grupoError) throw grupoError

  // El creador se une automáticamente
  const { error: joinError } = await supabaseAdmin
    .from('usuarios_grupos')
    .insert({ usuario_id: creadorId, grupo_id: grupo.id })

  if (joinError) throw joinError

  return grupo
}

export async function joinTorneoByCode(
  usuarioId: string,
  codigo: string
): Promise<UsuarioGrupo> {
  const { data: grupo, error: buscarError } = await supabaseAdmin
    .from('grupos_torneo')
    .select('id, max_participantes')
    .eq('codigo_invitacion', codigo.toUpperCase())
    .single()

  if (buscarError || !grupo) throw new Error('Código de torneo inválido')

  // Verificar límite de participantes
  if (grupo.max_participantes) {
    const { count } = await supabaseAdmin
      .from('usuarios_grupos')
      .select('*', { count: 'exact', head: true })
      .eq('grupo_id', grupo.id)

    if ((count ?? 0) >= grupo.max_participantes) {
      throw new Error('El torneo está lleno')
    }
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_grupos')
    .insert({ usuario_id: usuarioId, grupo_id: grupo.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ya sos parte de este torneo')
    throw error
  }

  return data
}
