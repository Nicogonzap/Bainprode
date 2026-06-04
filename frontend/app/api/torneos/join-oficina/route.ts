import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function joinOrCreateTorneo(
  supabase: ReturnType<typeof getServiceClient>,
  usuario_id: string,
  nombre: string
) {
  // Find existing torneo by name
  const { data: existing } = await supabase
    .from('torneos')
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle()

  let torneoId: string

  if (existing) {
    torneoId = existing.id
  } else {
    // Create it — use this user as creado_por
    // The handle_new_torneo trigger will auto-add the creator as member
    const { data: created, error } = await supabase
      .from('torneos')
      .insert({ nombre, creado_por: usuario_id })
      .select('id')
      .single()

    if (error || !created) return // Another concurrent request may have created it; ignore
    torneoId = created.id
    // Trigger already added user as member, we're done
    return
  }

  // Add user to existing torneo (ignore duplicates)
  await supabase
    .from('torneo_miembros')
    .upsert(
      { torneo_id: torneoId, usuario_id },
      { onConflict: 'torneo_id,usuario_id', ignoreDuplicates: true }
    )
}

export async function POST(request: Request) {
  try {
    const { usuario_id, oficina, tenure } = await request.json()

    if (!usuario_id || !oficina || !tenure) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getServiceClient()

    await Promise.all([
      joinOrCreateTorneo(supabase, usuario_id, `Prode Bain — ${oficina}`),
      joinOrCreateTorneo(supabase, usuario_id, `Prode Bain Tenure — ${tenure}`),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}