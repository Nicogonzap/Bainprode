import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    const { usuario_id, nombre, apellido, tenure, oficina } = await request.json()

    if (!usuario_id) return NextResponse.json({ error: 'Missing usuario_id' }, { status: 400 })

    const supabase = getServiceClient()

    const updates: Record<string, any> = {}
    if (nombre !== undefined) updates.nombre = nombre
    if (apellido !== undefined) updates.apellido = apellido
    if (tenure !== undefined) updates.tenure = tenure
    if (oficina !== undefined) updates.oficina = oficina

    // Also update nombre_usuario derived field
    if (nombre !== undefined || apellido !== undefined) {
      const { data: current } = await supabase
        .from('usuarios')
        .select('nombre, apellido')
        .eq('id', usuario_id)
        .single()

      const n = nombre ?? current?.nombre ?? ''
      const a = apellido ?? current?.apellido ?? ''
      updates.nombre_usuario = `${n} ${a}`.trim() || n || a
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', usuario_id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}