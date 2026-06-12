'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Save, Trash2, Calendar, Grid3x3, Users, AlertTriangle, Trophy } from 'lucide-react'
import { TopNav } from '@/components/top-nav'
import { Footer } from '@/components/footer'
import { CountryFlag } from '@/components/country-flag'
import { ToastProvider, useToast } from '@/components/toast'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'nicolas.gonzalezpedrini@bain.com'

const BAIN = {
  red: '#CC0000', black: '#000000', white: '#FFFFFF',
  grayBg: '#F5F5F5', grayBorder: '#E5E5E5',
  graySecondary: '#666666', grayTertiary: '#999999',
  success: '#0F7B3E', amber: '#B7791F',
} as const

const TZ = 'America/Argentina/Buenos_Aires'
const DAYS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
const MONTHS_ES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

type ApiEquipo = { id: string; nombre_pais: string; codigo_iso: string; bandera_url: string | null }
type ApiPartido = {
  id: string; fecha_hora: string; estadio: string | null; ciudad: string | null
  fase: string; grupo_fase: string | null; estado: string
  goles_local: number | null; goles_visitante: number | null
  equipo_local: ApiEquipo; equipo_visitante: ApiEquipo
}
type MatchResult = { home: number | ''; away: number | ''; estado: string }
type Results = Record<string, MatchResult>

function toDateLabel(fh: string) {
  const inTz = new Date(new Date(fh).toLocaleString('en-US', { timeZone: TZ }))
  return `${DAYS_ES[inTz.getDay()]} ${inTz.getDate()} DE ${MONTHS_ES[inTz.getMonth()]}`
}
function toDateSort(fh: string) {
  const inTz = new Date(new Date(fh).toLocaleString('en-US', { timeZone: TZ }))
  return `${inTz.getFullYear()}-${String(inTz.getMonth() + 1).padStart(2, '0')}-${String(inTz.getDate()).padStart(2, '0')}`
}
function toShortDate(fh: string) {
  const inTz = new Date(new Date(fh).toLocaleString('en-US', { timeZone: TZ }))
  return `${inTz.getDate()} ${MONTHS_SHORT[inTz.getMonth()]}`
}
function toTime(fh: string) {
  const inTz = new Date(new Date(fh).toLocaleString('en-US', { timeZone: TZ }))
  return `${String(inTz.getHours()).padStart(2, '0')}.${String(inTz.getMinutes()).padStart(2, '0')}`
}

function ViewTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className="text-sm font-medium px-4 py-3 transition-colors whitespace-nowrap flex items-center gap-2 h-14"
      style={{ color: active ? BAIN.black : BAIN.graySecondary, borderBottom: `2px solid ${active ? BAIN.red : 'transparent'}` }}>
      <span style={{ color: active ? BAIN.red : BAIN.graySecondary }}>{icon}</span>
      {label}
    </button>
  )
}

const ESTADO_OPTIONS = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizado', label: 'Finalizado' },
]

function MatchResultRow({ match, result, onUpdate, onSave, onClear, saving }: {
  match: ApiPartido; result: MatchResult
  onUpdate: (id: string, field: 'home' | 'away' | 'estado', value: string) => void
  onSave: (id: string) => void
  onClear: (id: string) => void
  saving: boolean
}) {
  const hasResult = result.home !== '' && result.away !== ''
  const isFinalizado = result.estado === 'finalizado'

  return (
    <div className="rounded-md px-4 py-3 flex flex-wrap items-center gap-3 transition-all"
      style={{ backgroundColor: BAIN.white, border: `1px solid ${isFinalizado ? BAIN.success + '40' : BAIN.grayBorder}` }}>

      <div className="flex flex-col min-w-[80px] flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BAIN.graySecondary }}>
          {match.grupo_fase ? `GRP ${match.grupo_fase}` : (match.fase ?? '').toUpperCase().slice(0, 8)}
        </span>
        <span className="text-xs font-medium" style={{ color: BAIN.black }}>
          {toShortDate(match.fecha_hora)} · {toTime(match.fecha_hora)}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-center min-w-[280px]">
        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
          <span className="text-sm font-bold truncate hidden sm:block" style={{ color: BAIN.black }}>{match.equipo_local.nombre_pais}</span>
          <CountryFlag code={match.equipo_local.codigo_iso} url={match.equipo_local.bandera_url ?? undefined} size="sm" />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <input type="number" min="0" max="30" placeholder="—" value={result.home}
            onChange={e => onUpdate(match.id, 'home', e.target.value)}
            className="w-11 h-9 text-center text-base font-bold rounded-md focus:outline-none"
            style={{ border: `1px solid ${result.home !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }}
          />
          <span className="text-sm font-bold px-0.5" style={{ color: BAIN.graySecondary }}>–</span>
          <input type="number" min="0" max="30" placeholder="—" value={result.away}
            onChange={e => onUpdate(match.id, 'away', e.target.value)}
            className="w-11 h-9 text-center text-base font-bold rounded-md focus:outline-none"
            style={{ border: `1px solid ${result.away !== '' ? BAIN.black : BAIN.grayBorder}`, backgroundColor: BAIN.white, color: BAIN.black }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
          <CountryFlag code={match.equipo_visitante.codigo_iso} url={match.equipo_visitante.bandera_url ?? undefined} size="sm" />
          <span className="text-sm font-bold truncate hidden sm:block" style={{ color: BAIN.black }}>{match.equipo_visitante.nombre_pais}</span>
        </div>
      </div>

      <select value={result.estado} onChange={e => onUpdate(match.id, 'estado', e.target.value)}
        className="text-xs px-2 py-1.5 rounded-md focus:outline-none flex-shrink-0"
        style={{ border: `1px solid ${BAIN.grayBorder}`, backgroundColor: BAIN.grayBg, color: isFinalizado ? BAIN.success : BAIN.graySecondary, cursor: 'pointer', fontWeight: isFinalizado ? 700 : 400 }}>
        {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasResult && (
          <button type="button" onClick={() => onClear(match.id)} disabled={saving}
            className="p-1.5 rounded-md transition-colors hover:bg-gray-100" title="Limpiar"
            style={{ color: BAIN.graySecondary }}>
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
        <button type="button" onClick={() => onSave(match.id)} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-shrink-0"
          style={{ backgroundColor: saving ? BAIN.grayBorder : BAIN.black, color: saving ? BAIN.graySecondary : BAIN.white, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving
            ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${BAIN.graySecondary} transparent transparent transparent` }} />
            : <Save size={12} strokeWidth={2.5} />
          }
          {saving ? '…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}


type AdminUser = {
  id: string; nombre: string | null; apellido: string | null
  nombre_usuario: string | null; email: string | null
  tenure: string | null; oficina: string | null; activo: boolean; created_at: string
}

function UsersView({ getToken, toast }: {
  getToken: () => Promise<string | null>
  toast: (opts: { message: string; type: 'success' | 'error'; duration?: number }) => void
}) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/usuarios', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setUsers(json.data ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const handleToggle = async (userId: string, nuevoActivo: boolean) => {
    setDeleting(userId)
    setConfirmId(null)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ usuario_id: userId, activo: nuevoActivo }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Error') }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: nuevoActivo } : u))
      toast({ message: nuevoActivo ? 'Usuario reactivado' : 'Usuario dado de baja', type: 'success', duration: 2000 })
    } catch (e: any) {
      toast({ message: e.message || 'Error', type: 'error', duration: 3000 })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
    </div>
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: BAIN.black }}>Usuarios</h1>
        <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: BAIN.grayBg, color: BAIN.graySecondary, border: `1px solid ${BAIN.grayBorder}` }}>
          {users.length} registrados
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div key={u.id} className="rounded-md px-4 py-3 flex flex-wrap items-center gap-3"
            style={{ backgroundColor: BAIN.white, border: `1px solid ${u.activo ? BAIN.grayBorder : BAIN.amber+'40'}`, opacity: u.activo ? 1 : 0.65 }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate" style={{ color: BAIN.black }}>
                  {u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre_usuario ?? '—'}
                </p>
                {!u.activo && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ backgroundColor: `${BAIN.amber}20`, color: BAIN.amber }}>BAJA</span>
                )}
              </div>
              <p className="text-xs truncate" style={{ color: BAIN.graySecondary }}>{u.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {u.tenure && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${BAIN.red}15`, color: BAIN.red }}>{u.tenure}</span>
              )}
              {u.oficina && (
                <span className="text-xs hidden sm:block" style={{ color: BAIN.grayTertiary }}>{u.oficina}</span>
              )}
              <span className="text-[10px]" style={{ color: BAIN.grayTertiary }}>
                {new Date(u.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {u.activo ? (
                confirmId === u.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: BAIN.amber }}>¿Confirmar baja?</span>
                    <button type="button" onClick={() => handleToggle(u.id, false)} disabled={deleting === u.id}
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: BAIN.red, color: BAIN.white }}>
                      {deleting === u.id ? '…' : 'Sí, dar de baja'}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: BAIN.grayBg, color: BAIN.graySecondary, border: `1px solid ${BAIN.grayBorder}` }}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmId(u.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-red-50"
                    style={{ color: BAIN.red, border: `1px solid ${BAIN.red}40` }}>
                    <Trash2 size={12} strokeWidth={2} />
                    Dar de baja
                  </button>
                )
              ) : (
                <button type="button" onClick={() => handleToggle(u.id, true)} disabled={deleting === u.id}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{ color: BAIN.success, border: `1px solid ${BAIN.success}40` }}>
                  {deleting === u.id ? '…' : 'Reactivar'}
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: BAIN.graySecondary }}>No hay usuarios registrados.</p>
        )}
      </div>
    </section>
  )
}

type PlayoffStanding = {
  id: string; name: string; code: string; url: string | null
  pj: number; gf: number; gc: number; dg: number; pts: number
  group: string; posLabel: string
}

function calcPlayoffStandings(groupMatches: ApiPartido[], group: string): PlayoffStanding[] {
  const table: Record<string, Omit<PlayoffStanding, 'dg' | 'posLabel'>> = {}
  for (const m of groupMatches) {
    if (!table[m.equipo_local.id])
      table[m.equipo_local.id] = { id: m.equipo_local.id, name: m.equipo_local.nombre_pais, code: m.equipo_local.codigo_iso, url: m.equipo_local.bandera_url, pj: 0, gf: 0, gc: 0, pts: 0, group }
    if (!table[m.equipo_visitante.id])
      table[m.equipo_visitante.id] = { id: m.equipo_visitante.id, name: m.equipo_visitante.nombre_pais, code: m.equipo_visitante.codigo_iso, url: m.equipo_visitante.bandera_url, pj: 0, gf: 0, gc: 0, pts: 0, group }
  }
  for (const m of groupMatches) {
    if (m.estado !== 'finalizado' || m.goles_local === null || m.goles_visitante === null) continue
    const hg = m.goles_local, ag = m.goles_visitante
    table[m.equipo_local.id].pj++; table[m.equipo_local.id].gf += hg; table[m.equipo_local.id].gc += ag
    table[m.equipo_visitante.id].pj++; table[m.equipo_visitante.id].gf += ag; table[m.equipo_visitante.id].gc += hg
    if (hg > ag) table[m.equipo_local.id].pts += 3
    else if (hg < ag) table[m.equipo_visitante.id].pts += 3
    else { table[m.equipo_local.id].pts += 1; table[m.equipo_visitante.id].pts += 1 }
  }
  return Object.values(table)
    .map(t => ({ ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
    .map((t, i) => ({ ...t, posLabel: `${i + 1}°` }))
}

function PlayoffsView() {
  const [matches, setMatches] = useState<ApiPartido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partidos?fase=grupos')
      .then(r => r.json())
      .then(({ data }) => { if (data) setMatches(data) })
      .finally(() => setLoading(false))
  }, [])

  const { byGroup, best8Thirds, bracket } = useMemo(() => {
    const empty = { byGroup: {} as Record<string, PlayoffStanding[]>, best8Thirds: [] as PlayoffStanding[], bracket: [] as [PlayoffStanding | null, PlayoffStanding | null][] }
    if (!matches.length) return empty
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L']
    const byGroup: Record<string, PlayoffStanding[]> = {}
    for (const g of groups) {
      byGroup[g] = calcPlayoffStandings(matches.filter(m => m.grupo_fase === g), g)
    }
    const allThirds: PlayoffStanding[] = groups.flatMap(g => byGroup[g]?.[2] ? [{ ...byGroup[g][2], group: g }] : [])
    const best8Thirds = [...allThirds].sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf).slice(0, 8)
    const getQ = (pos: 0 | 1, g: string): PlayoffStanding | null => byGroup[g]?.[pos] ?? null
    const bracket: [PlayoffStanding | null, PlayoffStanding | null][] = []
    const groupPairs: [string, string][] = [['A','B'],['C','D'],['E','F'],['G','H'],['I','J'],['K','L']]
    for (const [x, y] of groupPairs) {
      bracket.push([getQ(0, x), getQ(1, y)])
      bracket.push([getQ(0, y), getQ(1, x)])
    }
    for (let i = 0; i < 4; i++) bracket.push([best8Thirds[i] ?? null, best8Thirds[7 - i] ?? null])
    return { byGroup, best8Thirds, bracket }
  }, [matches])

  const finishedCount = matches.filter(m => m.estado === 'finalizado').length

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
    </div>
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: BAIN.black }}>Playoffs</h1>
          <p className="text-sm mt-1" style={{ color: BAIN.graySecondary }}>
            Basado en {finishedCount}/{matches.length} partidos de grupos finalizados
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: `${BAIN.amber}15`, color: BAIN.amber, border: `1px solid ${BAIN.amber}40` }}>
          TEST · Proyección
        </span>
      </div>

      <h2 className="text-xs font-bold uppercase mb-3 tracking-wider" style={{ color: BAIN.graySecondary }}>32 Clasificados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
          const rows = byGroup[g] ?? []
          return (
            <div key={g} className="rounded-md overflow-hidden" style={{ border: `1px solid ${BAIN.grayBorder}` }}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: BAIN.black, color: BAIN.white }}>Grupo {g}</div>
              {rows.slice(0, 4).map((row, idx) => {
                const qualifies = idx < 2
                const isTop8Third = idx === 2 && best8Thirds.some(t => t.id === row.id)
                return (
                  <div key={row.id} className="flex items-center gap-2 px-3 py-2"
                    style={{
                      backgroundColor: qualifies ? `${BAIN.success}08` : isTop8Third ? `${BAIN.amber}08` : BAIN.white,
                      borderTop: idx > 0 ? `1px solid ${BAIN.grayBorder}` : undefined,
                      opacity: !qualifies && !isTop8Third ? 0.45 : 1,
                    }}>
                    <span className="text-[10px] font-bold w-4 flex-shrink-0"
                      style={{ color: qualifies ? BAIN.success : isTop8Third ? BAIN.amber : BAIN.grayTertiary }}>
                      {idx + 1}°
                    </span>
                    <CountryFlag code={row.code} url={row.url ?? undefined} size="sm" />
                    <span className="text-xs font-medium flex-1 truncate" style={{ color: BAIN.black }}>{row.name}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: BAIN.graySecondary }}>{row.pts}pts</span>
                    {isTop8Third && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${BAIN.amber}25`, color: BAIN.amber }}>3M</span>
                    )}
                  </div>
                )
              })}
              {rows.length === 0 && (
                <div className="px-3 py-4 text-xs text-center" style={{ color: BAIN.grayTertiary }}>Sin datos</div>
              )}
            </div>
          )
        })}
      </div>

      <h2 className="text-xs font-bold uppercase mb-3 tracking-wider" style={{ color: BAIN.graySecondary }}>Llave — Octavos de Final</h2>
      {bracket.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: BAIN.graySecondary }}>
          Sin proyección aún — cargá resultados de grupos para ver la llave.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {bracket.map(([home, away], i) => {
            const isThirds = i >= 12
            const groupPairs = [['A','B'],['C','D'],['E','F'],['G','H'],['I','J'],['K','L']]
            const matchLabel = isThirds
              ? `3er puesto · Cruce ${i - 11}`
              : (() => {
                  const [x, y] = groupPairs[Math.floor(i / 2)]
                  return i % 2 === 0 ? `1° Grp ${x} vs 2° Grp ${y}` : `1° Grp ${y} vs 2° Grp ${x}`
                })()
            return (
              <div key={i} className="rounded-md px-4 py-3"
                style={{ backgroundColor: BAIN.white, border: `1px solid ${isThirds ? BAIN.amber + '40' : BAIN.grayBorder}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isThirds ? BAIN.amber : BAIN.grayTertiary }}>{matchLabel}</span>
                  <span className="text-[10px]" style={{ color: BAIN.grayTertiary }}>M{49 + i}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {home ? (
                      <>
                        <CountryFlag code={home.code} url={home.url ?? undefined} size="sm" />
                        <span className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{home.name}</span>
                        <span className="text-[10px] px-1 rounded flex-shrink-0" style={{ backgroundColor: BAIN.grayBg, color: BAIN.graySecondary }}>
                          {home.posLabel} {home.group}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs italic" style={{ color: BAIN.grayTertiary }}>Por definir</span>
                    )}
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: BAIN.graySecondary }}>vs</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    {away ? (
                      <>
                        <span className="text-[10px] px-1 rounded flex-shrink-0" style={{ backgroundColor: BAIN.grayBg, color: BAIN.graySecondary }}>
                          {away.posLabel} {away.group}
                        </span>
                        <span className="text-sm font-bold truncate" style={{ color: BAIN.black }}>{away.name}</span>
                        <CountryFlag code={away.code} url={away.url ?? undefined} size="sm" />
                      </>
                    ) : (
                      <span className="text-xs italic" style={{ color: BAIN.grayTertiary }}>Por definir</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}


function AdminContent() {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [partidos, setPartidos] = useState<ApiPartido[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Results>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'fecha' | 'grupo' | 'usuarios' | 'playoffs'>('fecha')

  useEffect(() => {
    if (authLoading) return
    if (!user || user.email !== ADMIN_EMAIL) router.replace('/home')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return
    fetch('/api/partidos')
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        setPartidos(data)
        const init: Results = {}
        for (const p of data as ApiPartido[]) {
          init[p.id] = { home: p.goles_local ?? '', away: p.goles_visitante ?? '', estado: p.estado ?? 'programado' }
        }
        setResults(init)
      })
      .finally(() => setLoading(false))
  }, [user])

  const updateResult = useCallback((id: string, field: 'home' | 'away' | 'estado', value: string) => {
    setResults(prev => {
      const cur = prev[id] ?? { home: '', away: '', estado: 'programado' }
      if (field === 'home' || field === 'away') {
        const parsed = value === '' ? '' : Math.max(0, Math.min(30, Number(value) || 0))
        return { ...prev, [id]: { ...cur, [field]: parsed } }
      }
      return { ...prev, [id]: { ...cur, estado: value } }
    })
  }, [])

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const saveMatch = useCallback(async (partidoId: string) => {
    if (!user) return
    const r = results[partidoId]
    if (!r) return
    setSaving(prev => ({ ...prev, [partidoId]: true }))
    try {
      const token = await getToken()
      if (!token) throw new Error('Sin sesión')
      const body: Record<string, any> = { partido_id: partidoId, estado: r.estado }
      if (r.home !== '') body.goles_local = Number(r.home)
      else body.goles_local = null
      if (r.away !== '') body.goles_visitante = Number(r.away)
      else body.goles_visitante = null
      const res = await fetch('/api/admin/resultados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Error') }
      toast({ message: 'Guardado', type: 'success', duration: 1500 })
    } catch (e: any) {
      toast({ message: e.message || 'Error al guardar', type: 'error', duration: 3000 })
    } finally {
      setSaving(prev => ({ ...prev, [partidoId]: false }))
    }
  }, [user, results, getToken, toast])

  const clearMatch = useCallback(async (partidoId: string) => {
    if (!user) return
    setSaving(prev => ({ ...prev, [partidoId]: true }))
    try {
      const token = await getToken()
      if (!token) throw new Error('Sin sesión')
      const res = await fetch('/api/admin/resultados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ partido_id: partidoId, goles_local: null, goles_visitante: null, estado: 'programado' }),
      })
      if (!res.ok) throw new Error('Error al limpiar')
      setResults(prev => ({ ...prev, [partidoId]: { home: '', away: '', estado: 'programado' } }))
      toast({ message: 'Resultado limpiado', type: 'success', duration: 1500 })
    } catch (e: any) {
      toast({ message: e.message || 'Error', type: 'error' })
    } finally {
      setSaving(prev => ({ ...prev, [partidoId]: false }))
    }
  }, [user, getToken, toast])

  const dayGroups = useMemo(() => {
    const map = new Map<string, { label: string; matches: ApiPartido[] }>()
    for (const p of partidos) {
      const sort = toDateSort(p.fecha_hora)
      if (!map.has(sort)) map.set(sort, { label: toDateLabel(p.fecha_hora), matches: [] })
      map.get(sort)!.matches.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([dateSort, v]) => ({ dateSort, ...v }))
  }, [partidos])

  const groupSections = useMemo(() => {
    const map = new Map<string, ApiPartido[]>()
    for (const p of partidos) {
      const g = p.grupo_fase ?? 'Sin grupo'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([group, matches]) => ({ group, matches }))
  }, [partidos])

  if (authLoading) return null
  if (!user || user.email !== ADMIN_EMAIL) return null

  const finalizadoCount = Object.values(results).filter(r => r.estado === 'finalizado').length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BAIN.grayBg }}>
      <TopNav />

      <div className="sticky top-16 z-40" style={{ backgroundColor: BAIN.white, borderBottom: `1px solid ${BAIN.grayBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-4 h-14">
          <nav className="flex items-center gap-1">
            <ViewTab icon={<Calendar size={14} strokeWidth={2} />} label="Por fecha" active={viewMode === 'fecha'} onClick={() => setViewMode('fecha')} />
            <ViewTab icon={<Grid3x3 size={14} strokeWidth={2} />} label="Por grupo" active={viewMode === 'grupo'} onClick={() => setViewMode('grupo')} />
            <ViewTab icon={<Users size={14} strokeWidth={2} />} label="Usuarios" active={viewMode === 'usuarios'} onClick={() => setViewMode('usuarios')} />
            <ViewTab icon={<Trophy size={14} strokeWidth={2} />} label="Playoffs" active={viewMode === 'playoffs'} onClick={() => setViewMode('playoffs')} />
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs" style={{ color: BAIN.graySecondary }}>{finalizadoCount} / {partidos.length} finalizados</span>
            <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: `${BAIN.amber}15`, color: BAIN.amber, border: `1px solid ${BAIN.amber}40` }}>
              TEST · Solo vos
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: BAIN.black }}>Resultados Reales</h1>
          <p className="text-sm" style={{ color: BAIN.graySecondary }}>Cargá resultados para testear el sistema de puntos. Solo visible para <strong>nicolas.gonzalezpedrini@bain.com</strong>.</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${BAIN.red} transparent transparent transparent` }} />
          </div>
        ) : viewMode === 'fecha' ? (
          dayGroups.map((day, idx) => (
            <section key={day.dateSort} className="mb-8 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards', animationDuration: '350ms' }}>
              <h2 className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>{day.label}</h2>
              <div className="flex flex-col gap-2">
                {day.matches.map(m => (
                  <MatchResultRow key={m.id} match={m}
                    result={results[m.id] ?? { home: '', away: '', estado: 'programado' }}
                    onUpdate={updateResult} onSave={saveMatch} onClear={clearMatch} saving={!!saving[m.id]} />
                ))}
              </div>
            </section>
          ))
        ) : viewMode === 'grupo' ? (
          groupSections.map((g, idx) => (
            <section key={g.group} className="mb-6 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards', animationDuration: '350ms' }}>
              <h2 className="text-xs font-bold uppercase mb-3" style={{ color: BAIN.graySecondary, letterSpacing: '0.08em' }}>
                {g.group === 'Sin grupo' ? g.group : `Grupo ${g.group}`}
              </h2>
              <div className="flex flex-col gap-2">
                {g.matches.map(m => (
                  <MatchResultRow key={m.id} match={m}
                    result={results[m.id] ?? { home: '', away: '', estado: 'programado' }}
                    onUpdate={updateResult} onSave={saveMatch} onClear={clearMatch} saving={!!saving[m.id]} />
                ))}
              </div>
            </section>
          ))
        ) : viewMode === 'usuarios' ? (
          <UsersView getToken={getToken} toast={toast} />
        ) : (
          <PlayoffsView />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function AdminPage() {
  return <ToastProvider><AdminContent /></ToastProvider>
}