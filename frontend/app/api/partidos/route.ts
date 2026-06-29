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
  const fase = searchParams.get('fase')

  try {
    const supabase = getServerClient()
    let query = supabase
      .from('partidos')
      .select(`
        id,
        fecha_hora,
        estadio,
        ciudad,
        fase,
        grupo_fase,
        estado,
        goles_local,
        goles_visitante,
        ganador_id,
        equipo_local:equipos!equipo_local_id (id, nombre_pais, codigo_iso, bandera_url),
        equipo_visitante:equipos!equipo_visitante_id (id, nombre_pais, codigo_iso, bandera_url)
      `)
      .order('fecha_hora', { ascending: true })

    if (fase) query = (query as any).eq('fase', fase)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}