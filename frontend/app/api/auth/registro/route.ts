import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, nombre, apellido, tenure, oficina } = body

    if (!email?.toLowerCase().endsWith('@bain.com')) {
      return NextResponse.json({ error: 'Solo se permiten emails @bain.com' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        tenure,
        oficina,
        nombre_usuario: `${nombre.trim()} ${apellido.trim()}`,
      },
    })

    if (error) throw error

    return NextResponse.json({ user_id: data.user.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al registrar'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
