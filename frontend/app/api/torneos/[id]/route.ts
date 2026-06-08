import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = getServerClient()
    const [torneoRes, membersRes] = await Promise.all([
      supabase.from('torneos').select('*').eq('id', id).single(),
      supabase
        .from('torneo_miembros')
        .select('usuario_id, estado, joined_at')
        .eq('torneo_id', id)
        .eq('estado', 'activo'),
    ])
    if (torneoRes.error) throw torneoRes.error
    if (membersRes.error) throw membersRes.error

    const memberIds = membersRes.data?.map((m: any) => m.usuario_id) ?? []
    let puntosMap: Record<string, number> = {}
    let usuariosMap: Record<string, any> = {}
    if (memberIds.length > 0) {
      const [puntosRes, usuariosRes] = await Promise.all([
        supabase.from('historial_puntos').select('usuario_id, puntos').in('usuario_id', memberIds),
        supabase.from('usuarios').select('id, nombre, apellido, nombre_usuario, tenure').in('id', memberIds).eq('activo', true),
      ])
      puntosRes.data?.forEach((p: any) => {
        puntosMap[p.usuario_id] = (puntosMap[p.usuario_id] ?? 0) + p.puntos
      })
      usuariosRes.data?.forEach((u: any) => { usuariosMap[u.id] = u })
    }

    const members = (membersRes.data ?? [])
      .map((m: any) => ({ ...usuariosMap[m.usuario_id], puntos: puntosMap[m.usuario_id] ?? 0 }))
      .sort((a: any, b: any) => b.puntos - a.puntos)

    return NextResponse.json({ torneo: torneoRes.data, members })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { nombre, descripcion, usuario_id } = await request.json()
    if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

    const supabase = getServerClient()
    const { data: torneo } = await supabase.from('torneos').select('creado_por').eq('id', id).single()
    if (!torneo || torneo.creado_por !== usuario_id) {
      return NextResponse.json({ error: 'Solo el creador puede editar el torneo' }, { status: 403 })
    }

    const updates: Record<string, string | null> = {}
    if (nombre?.trim()) updates.nombre = nombre.trim()
    if (descripcion !== undefined) updates.descripcion = descripcion?.trim() || null

    const { data, error } = await supabase
      .from('torneos').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ torneo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const usuario_id = searchParams.get('usuario_id')
    if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

    const supabase = getServerClient()
    const { data: torneo, error: fetchError } = await supabase
      .from('torneos').select('creado_por').eq('id', id).single()

    if (fetchError) throw fetchError
    if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    if (torneo.creado_por !== usuario_id) {
      return NextResponse.json({ error: 'Solo el creador puede eliminar el torneo' }, { status: 403 })
    }

    const { error } = await supabase.from('torneos').update({ activo: false }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}