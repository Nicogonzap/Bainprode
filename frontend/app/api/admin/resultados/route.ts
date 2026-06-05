import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'nicolas.gonzalezpedrini@bain.com'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { partido_id, goles_local, goles_visitante, estado } = body

    if (!partido_id) return NextResponse.json({ error: 'partido_id required' }, { status: 400 })

    const update: Record<string, any> = {}
    if (goles_local !== undefined) update.goles_local = goles_local
    if (goles_visitante !== undefined) update.goles_visitante = goles_visitante
    if (estado !== undefined) update.estado = estado

    const { error } = await supabase.from('partidos').update(update).eq('id', partido_id)
    if (error) throw error

    if (
      estado === 'finalizado' &&
      update.goles_local !== null && update.goles_local !== undefined &&
      update.goles_visitante !== null && update.goles_visitante !== undefined
    ) {
      // (Re)calculate points — the function upserts so it handles score changes too
      await supabase.rpc('calcular_puntos_prediccion', { p_partido_id: partido_id })
    } else if (estado !== 'finalizado') {
      // Reverted from finalizado → clear stale points and reset predicciones
      await Promise.all([
        supabase.from('historial_puntos').delete().eq('partido_id', partido_id),
        supabase.from('predicciones').update({ puntos_obtenidos: null }).eq('partido_id', partido_id),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}