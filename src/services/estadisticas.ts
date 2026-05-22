import { supabaseAdmin } from '../lib/supabase'
import type { FasePartido } from '../types/database.types'

interface PuntosPorGrupoMundial {
  grupo_fase: string
  partidos_predichos: number
  puntos_totales: number
  aciertos_exactos: number
}

interface DiferenciaPorContinente {
  continente: string
  partidos_predichos: number
  diferencia_promedio: number
}

interface PuntosPorFase {
  fase: FasePartido
  partidos_predichos: number
  puntos_totales: number
}

interface GoleadorImaginario {
  equipo_id: string
  nombre_pais: string
  codigo_iso: string
  goles_pred_acertados: number
  partidos: number
}

export interface EstadisticasPersonales {
  usuario_id: string
  puntos_por_grupo_mundial: PuntosPorGrupoMundial[]
  diferencia_por_continente: DiferenciaPorContinente[]
  puntos_por_fase: PuntosPorFase[]
  goleador_imaginario: GoleadorImaginario[]
}

export async function getEstadisticasPersonales(
  usuarioId: string
): Promise<EstadisticasPersonales> {
  const [puntosPorGrupo, puntajesPorFase, predicciones] = await Promise.all([
    _getPuntosPorGrupoMundial(usuarioId),
    _getPuntosPorFase(usuarioId),
    _getPrediccionesConContexto(usuarioId),
  ])

  const diferenciaPorContinente = _calcularDiferenciaPorContinente(predicciones)
  const goleadorImaginario = _calcularGoleadorImaginario(predicciones)

  return {
    usuario_id: usuarioId,
    puntos_por_grupo_mundial: puntosPorGrupo,
    diferencia_por_continente: diferenciaPorContinente,
    puntos_por_fase: puntajesPorFase,
    goleador_imaginario: goleadorImaginario,
  }
}

async function _getPuntosPorGrupoMundial(
  usuarioId: string
): Promise<PuntosPorGrupoMundial[]> {
  const { data, error } = await supabaseAdmin
    .from('predicciones')
    .select(`
      puntos_obtenidos,
      partidos (
        fase,
        goles_local,
        goles_visitante,
        equipo_local:equipos!equipo_local_id (grupo_fase),
        equipo_visitante:equipos!equipo_visitante_id (grupo_fase)
      )
    `)
    .eq('usuario_id', usuarioId)
    .not('puntos_obtenidos', 'is', null)

  if (error) throw error

  const mapa = new Map<string, PuntosPorGrupoMundial>()

  for (const row of data ?? []) {
    const partido = row.partidos as any
    if (!partido || partido.fase !== 'grupos') continue

    const grupo = partido.equipo_local?.grupo_fase as string
    if (!grupo) continue

    const entry = mapa.get(grupo) ?? {
      grupo_fase: grupo,
      partidos_predichos: 0,
      puntos_totales: 0,
      aciertos_exactos: 0,
    }

    entry.partidos_predichos++
    entry.puntos_totales += row.puntos_obtenidos ?? 0

    const pred = row as any
    if (
      pred.goles_local_pred === partido.goles_local &&
      pred.goles_visitante_pred === partido.goles_visitante
    ) {
      entry.aciertos_exactos++
    }

    mapa.set(grupo, entry)
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.grupo_fase.localeCompare(b.grupo_fase)
  )
}

async function _getPuntosPorFase(usuarioId: string): Promise<PuntosPorFase[]> {
  const { data, error } = await supabaseAdmin
    .from('predicciones')
    .select(`
      puntos_obtenidos,
      partidos (fase)
    `)
    .eq('usuario_id', usuarioId)
    .not('puntos_obtenidos', 'is', null)

  if (error) throw error

  const mapa = new Map<FasePartido, PuntosPorFase>()

  for (const row of data ?? []) {
    const fase = (row.partidos as any)?.fase as FasePartido
    if (!fase) continue

    const entry = mapa.get(fase) ?? {
      fase,
      partidos_predichos: 0,
      puntos_totales: 0,
    }

    entry.partidos_predichos++
    entry.puntos_totales += row.puntos_obtenidos ?? 0
    mapa.set(fase, entry)
  }

  const orden: FasePartido[] = [
    'grupos',
    'octavos',
    'cuartos',
    'semifinal',
    'tercer_puesto',
    'final',
  ]

  return orden.flatMap((f) => (mapa.has(f) ? [mapa.get(f)!] : []))
}

async function _getPrediccionesConContexto(usuarioId: string) {
  const { data, error } = await supabaseAdmin
    .from('predicciones')
    .select(`
      goles_local_pred,
      goles_visitante_pred,
      puntos_obtenidos,
      partidos (
        goles_local,
        goles_visitante,
        equipo_local:equipos!equipo_local_id (id, nombre_pais, codigo_iso, continente),
        equipo_visitante:equipos!equipo_visitante_id (id, nombre_pais, codigo_iso, continente)
      )
    `)
    .eq('usuario_id', usuarioId)

  if (error) throw error
  return data ?? []
}

function _calcularDiferenciaPorContinente(predicciones: any[]): DiferenciaPorContinente[] {
  const mapa = new Map<string, { suma: number; count: number }>()

  for (const row of predicciones) {
    const partido = row.partidos
    if (!partido?.goles_local == null) continue

    const localCont: string = partido.equipo_local?.continente
    const visitanteCont: string = partido.equipo_visitante?.continente

    const difLocal = Math.abs(row.goles_local_pred - (partido.goles_local ?? 0))
    const difVisitante = Math.abs(
      row.goles_visitante_pred - (partido.goles_visitante ?? 0)
    )

    for (const [cont, dif] of [
      [localCont, difLocal],
      [visitanteCont, difVisitante],
    ] as [string, number][]) {
      if (!cont) continue
      const entry = mapa.get(cont) ?? { suma: 0, count: 0 }
      entry.suma += dif
      entry.count++
      mapa.set(cont, entry)
    }
  }

  return Array.from(mapa.entries())
    .map(([continente, { suma, count }]) => ({
      continente,
      partidos_predichos: count,
      diferencia_promedio: count > 0 ? Math.round((suma / count) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.diferencia_promedio - b.diferencia_promedio)
}

function _calcularGoleadorImaginario(predicciones: any[]): GoleadorImaginario[] {
  const mapa = new Map<
    string,
    { nombre_pais: string; codigo_iso: string; aciertos: number; partidos: number }
  >()

  for (const row of predicciones) {
    const partido = row.partidos
    if (!partido) continue

    const local = partido.equipo_local
    const visitante = partido.equipo_visitante

    // Verificar si acertó los goles del equipo local
    if (local) {
      const key = local.id
      const entry = mapa.get(key) ?? {
        nombre_pais: local.nombre_pais,
        codigo_iso: local.codigo_iso,
        aciertos: 0,
        partidos: 0,
      }
      entry.partidos++
      if (
        partido.goles_local !== null &&
        row.goles_local_pred === partido.goles_local
      ) {
        entry.aciertos++
      }
      mapa.set(key, entry)
    }

    // Verificar si acertó los goles del equipo visitante
    if (visitante) {
      const key = visitante.id
      const entry = mapa.get(key) ?? {
        nombre_pais: visitante.nombre_pais,
        codigo_iso: visitante.codigo_iso,
        aciertos: 0,
        partidos: 0,
      }
      entry.partidos++
      if (
        partido.goles_visitante !== null &&
        row.goles_visitante_pred === partido.goles_visitante
      ) {
        entry.aciertos++
      }
      mapa.set(key, entry)
    }
  }

  return Array.from(mapa.entries())
    .map(([equipo_id, v]) => ({ equipo_id, ...v, goles_pred_acertados: v.aciertos }))
    .sort((a, b) => b.goles_pred_acertados - a.goles_pred_acertados)
    .slice(0, 10)
}
