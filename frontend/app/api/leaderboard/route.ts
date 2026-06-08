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

    // Fetch leaderboard rows
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('posicion', { ascending: true })

    if (grupoId) query = query.eq('grupo_id', grupoId)

    const { data: lbData, error } = await query
    if (error) throw error

    if (!lbData || lbData.length === 0) return NextResponse.json({ data: [] })

    // Enrich with oficina and tenure from usuarios table
    const userIds = lbData.map((r: any) => r.usuario_id).filter(Boolean)
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, oficina, tenure')
      .in('id', userIds)
      .eq('activo', true)

    const usuariosMap: Record<string, { oficina: string | null; tenure: string | null }> = {}
    for (const u of usuariosData ?? []) {
      usuariosMap[u.id] = { oficina: u.oficina ?? null, tenure: u.tenure ?? null }
    }

    const enriched = lbData.map((r: any) => ({
      ...r,
      oficina: usuariosMap[r.usuario_id]?.oficina ?? null,
      tenure: usuariosMap[r.usuario_id]?.tenure ?? null,
    }))

    return NextResponse.json({ data: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}