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
  const codigo_iso = searchParams.get('codigo_iso')
  const posicion = searchParams.get('posicion')

  if (!codigo_iso) return NextResponse.json({ error: 'codigo_iso required' }, { status: 400 })

  try {
    const supabase = getServerClient()

    // Buscar el equipo por codigo_iso
    const { data: equipo, error: eqError } = await supabase
      .from('equipos')
      .select('id')
      .eq('codigo_iso', codigo_iso)
      .maybeSingle()

    if (eqError) throw eqError
    if (!equipo) return NextResponse.json({ data: [] })

    let query = supabase
      .from('jugadores')
      .select('id, nombre, posicion, numero')
      .eq('equipo_id', equipo.id)
      .order('nombre', { ascending: true })

    if (posicion) query = (query as any).eq('posicion', posicion)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}