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
      .from('predicciones_especiales')
      .select('*')
      .eq('usuario_id', usuarioId)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      usuario_id,
      campeon,
      goleador_nombre,
      goleador_equipo,
      asistente_nombre,
      asistente_equipo,
      sorpresa,
    } = body

    if (!usuario_id) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 })

    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('predicciones_especiales')
      .upsert(
        {
          usuario_id,
          campeon,
          goleador_nombre,
          goleador_equipo,
          asistente_nombre,
          asistente_equipo,
          sorpresa,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'usuario_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}