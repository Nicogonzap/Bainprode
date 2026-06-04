import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const { invite_code, usuario_id } = await request.json()
    if (!invite_code || !usuario_id) {
      return NextResponse.json({ error: 'invite_code and usuario_id required' }, { status: 400 })
    }
    const supabase = getServerClient()

    const { data: torneo, error: torneoError } = await supabase
      .from('torneos')
      .select('id, nombre')
      .eq('invite_code', invite_code)
      .eq('activo', true)
      .single()
    if (torneoError || !torneo) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    // Verificar si ya existe una membresia (activa o inactiva)
    const { data: existing } = await supabase
      .from('torneo_miembros')
      .select('estado, activo')
      .eq('torneo_id', torneo.id)
      .eq('usuario_id', usuario_id)
      .maybeSingle()

    if (existing) {
      if (existing.activo) {
        // Ya es miembro activo o pendiente
        return NextResponse.json({ torneo_id: torneo.id, estado: existing.estado })
      } else {
        // Salio antes, reactivar como pendiente
        const { error } = await supabase
          .from('torneo_miembros')
          .update({ activo: true, estado: 'pendiente' })
          .eq('torneo_id', torneo.id)
          .eq('usuario_id', usuario_id)
        if (error) throw error
        return NextResponse.json({ torneo_id: torneo.id, torneo_nombre: torneo.nombre, estado: 'pendiente' })
      }
    }

    const { error: joinError } = await supabase
      .from('torneo_miembros')
      .insert({ torneo_id: torneo.id, usuario_id, estado: 'pendiente', activo: true })
    if (joinError) throw joinError

    return NextResponse.json({ torneo_id: torneo.id, torneo_nombre: torneo.nombre, estado: 'pendiente' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}