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
  const usuarioId = searchParams.get('usuario_id')
  if (!usuarioId) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 })

  try {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('predicciones')
      .select('*')
      .eq('usuario_id', usuarioId)

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { usuario_id, partido_id, goles_local, goles_visitante } = body

    if (!usuario_id || !partido_id || goles_local === undefined || goles_visitante === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('predicciones')
      .upsert(
        { usuario_id, partido_id, goles_local, goles_visitante },
        { onConflict: 'usuario_id,partido_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}