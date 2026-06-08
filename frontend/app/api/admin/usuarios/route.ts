import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'nicolas.gonzalezpedrini@bain.com'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await getAdminClient().auth.getUser(token)
  if (data.user?.email !== ADMIN_EMAIL) return null
  return data.user
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido, nombre_usuario, email, tenure, oficina, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { usuario_id } = await req.json()
  if (!usuario_id) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 })

  const supabase = getAdminClient()

  // Delete all user data from public tables first (order matters for FK constraints)
  await supabase.from('historial_puntos').delete().eq('usuario_id', usuario_id)
  await supabase.from('predicciones').delete().eq('usuario_id', usuario_id)
  await supabase.from('predicciones_especiales').delete().eq('usuario_id', usuario_id)
  await supabase.from('torneo_miembros').delete().eq('usuario_id', usuario_id)
  await supabase.from('usuarios').delete().eq('id', usuario_id)

  // Delete from auth (removes login capability)
  const { error } = await supabase.auth.admin.deleteUser(usuario_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
