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
    .select('id, nombre, apellido, nombre_usuario, email, tenure, oficina, activo, created_at')
    .order('activo', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { usuario_id, activo } = await req.json()
  if (!usuario_id || typeof activo !== 'boolean') {
    return NextResponse.json({ error: 'usuario_id y activo requeridos' }, { status: 400 })
  }

  const supabase = getAdminClient()
  const { error } = await supabase
    .from('usuarios')
    .update({ activo })
    .eq('id', usuario_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
