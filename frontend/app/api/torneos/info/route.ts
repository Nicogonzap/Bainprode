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
  const invite_code = searchParams.get('invite_code')
  if (!invite_code) return NextResponse.json({ error: 'invite_code required' }, { status: 400 })
  try {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('torneos')
      .select('id, nombre')
      .eq('invite_code', invite_code)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: data.id, nombre: data.nombre })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}