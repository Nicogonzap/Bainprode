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
  const grupoId = searchParams.get('grupo_id')

  try {
    const supabase = getServerClient()
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('posicion', { ascending: true })

    if (grupoId) query = query.eq('grupo_id', grupoId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}