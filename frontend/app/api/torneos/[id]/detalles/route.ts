import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: torneoId } = await params
  const { searchParams } = new URL(request.url)
  const usuario_id = searchParams.get('usuario_id')
  if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

  try {
    const supabase = getServerClient()

    const [historialRes, predRes] = await Promise.all([
      supabase
        .from('historial_puntos')
        .select('partido_id, puntos, es_exacto')
        .eq('usuario_id', usuario_id),
      supabase
        .from('predicciones')
        .select('partido_id, goles_local, goles_visitante')
        .eq('usuario_id', usuario_id),
    ])

    const historialMap: Record<string, { puntos: number; es_exacto: boolean }> = {}
    for (const h of historialRes.data ?? []) {
      historialMap[h.partido_id] = { puntos: h.puntos, es_exacto: h.es_exacto }
    }

    const predMap: Record<string, { goles_local: number; goles_visitante: number }> = {}
    for (const p of predRes.data ?? []) {
      predMap[p.partido_id] = { goles_local: p.goles_local, goles_visitante: p.goles_visitante }
    }

    const allPartidoIds = [
      ...new Set([
        ...Object.keys(historialMap),
        ...Object.keys(predMap),
      ]),
    ]

    if (allPartidoIds.length === 0) return NextResponse.json({ detalles: [] })

    const { data: partidos, error } = await supabase
      .from('partidos')
      .select(`
        id, fecha_hora, goles_local, goles_visitante, estado, fase, grupo_fase,
        equipo_local:equipos!equipo_local_id (codigo_iso, nombre_pais, bandera_url),
        equipo_visitante:equipos!equipo_visitante_id (codigo_iso, nombre_pais, bandera_url)
      `)
      .in('id', allPartidoIds)
      .eq('estado', 'finalizado')
      .order('fecha_hora', { ascending: true })

    if (error) throw error

    const detalles = (partidos ?? []).map((p: any) => {
      const h = historialMap[p.id]
      const pred = predMap[p.id]
      return {
        partido_id: p.id,
        fecha: p.fecha_hora,
        fase: p.fase,
        grupo_fase: p.grupo_fase,
        local_codigo: p.equipo_local?.codigo_iso ?? '',
        local_nombre: p.equipo_local?.nombre_pais ?? '',
        local_url: p.equipo_local?.bandera_url ?? null,
        visitante_codigo: p.equipo_visitante?.codigo_iso ?? '',
        visitante_nombre: p.equipo_visitante?.nombre_pais ?? '',
        visitante_url: p.equipo_visitante?.bandera_url ?? null,
        resultado_local: p.goles_local,
        resultado_visitante: p.goles_visitante,
        pred_local: pred?.goles_local ?? null,
        pred_visitante: pred?.goles_visitante ?? null,
        puntos: h?.puntos ?? 0,
        es_exacto: h?.es_exacto ?? false,
      }
    })

    return NextResponse.json({ detalles })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}