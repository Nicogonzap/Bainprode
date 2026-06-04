import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuario_id = searchParams.get('usuario_id')
  if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

  try {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('torneo_miembros')
      .select('estado, torneos (id, nombre, descripcion, invite_code, creado_por, created_at, activo)')
      .eq('usuario_id', usuario_id)
      .eq('activo', true)

    if (error) throw error
    const torneos = data
      ?.map((d: any) => ({ ...d.torneos, estado: d.estado ?? 'activo' }))
      .filter((t: any) => t && t.activo !== false) ?? []
    return NextResponse.json({ data: torneos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, descripcion, creado_por } = await request.json()
    if (!nombre?.trim() || !creado_por) {
      return NextResponse.json({ error: 'nombre and creado_por required' }, { status: 400 })
    }
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('torneos')
      .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null, creado_por })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ torneo: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}