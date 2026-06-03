import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Aceptar invitacion pendiente -> activo
export async function POST(request: Request) {
  try {
    const { torneo_id, usuario_id } = await request.json()
    if (!torneo_id || !usuario_id) {
      return NextResponse.json({ error: 'torneo_id and usuario_id required' }, { status: 400 })
    }
    const supabase = getServerClient()
    const { error } = await supabase
      .from('torneo_miembros')
      .update({ estado: 'activo' })
      .eq('torneo_id', torneo_id)
      .eq('usuario_id', usuario_id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Cancelar/rechazar invitacion
export async function DELETE(request: Request) {
  try {
    const { torneo_id, usuario_id } = await request.json()
    if (!torneo_id || !usuario_id) {
      return NextResponse.json({ error: 'torneo_id and usuario_id required' }, { status: 400 })
    }
    const supabase = getServerClient()
    const { error } = await supabase
      .from('torneo_miembros')
      .delete()
      .eq('torneo_id', torneo_id)
      .eq('usuario_id', usuario_id)
      .eq('estado', 'pendiente')
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}