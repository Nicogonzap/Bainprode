import { supabaseAdmin } from '../lib/supabase'
import type { Prediccion, PrediccionVsResultado } from '../types/database.types'

export async function getPrediccionesDeUsuario(
  usuarioId: string,
  opciones?: { partidoId?: string; fase?: string }
): Promise<Prediccion[]> {
  let query = supabaseAdmin
    .from('predicciones')
    .select('*')
    .eq('usuario_id', usuarioId)

  if (opciones?.partidoId) {
    query = query.eq('partido_id', opciones.partidoId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertPrediccion(
  usuarioId: string,
  partidoId: string,
  golesLocalPred: number,
  golesVisitantePred: number
): Promise<Prediccion> {
  // Verificar que el partido aún no empezó
  const { data: partido, error: partidoError } = await supabaseAdmin
    .from('partidos')
    .select('estado, fecha_hora')
    .eq('id', partidoId)
    .single()

  if (partidoError || !partido) throw new Error('Partido no encontrado')
  if (partido.estado !== 'programado') {
    throw new Error('No se puede modificar la predicción: el partido ya comenzó o finalizó')
  }

  const now = new Date()
  if (new Date(partido.fecha_hora) <= now) {
    throw new Error('El partido ya comenzó, no se puede modificar la predicción')
  }

  const { data, error } = await supabaseAdmin
    .from('predicciones')
    .upsert(
      {
        usuario_id: usuarioId,
        partido_id: partidoId,
        goles_local_pred: golesLocalPred,
        goles_visitante_pred: golesVisitantePred,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'usuario_id,partido_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPrediccionesVsResultados(
  usuarioId: string,
  grupoId?: string
): Promise<PrediccionVsResultado[]> {
  let query = supabaseAdmin
    .from('predicciones_vs_resultado')
    .select('*')
    .eq('usuario_id', usuarioId)

  if (grupoId) {
    // Filtrar predicciones que el usuario tiene en ese grupo de torneo
    const { data: partidos } = await supabaseAdmin
      .from('historial_puntos')
      .select('partido_id')
      .eq('usuario_id', usuarioId)
      .eq('grupo_id', grupoId)

    const ids = (partidos ?? []).map((p: any) => p.partido_id)
    if (ids.length > 0) {
      query = query.in('partido_id', ids)
    }
  }

  const { data, error } = await query.order('partido_id')
  if (error) throw error
  return data ?? []
}
