import { supabaseAdmin } from '../lib/supabase'
import type { LeaderboardRow } from '../types/database.types'

export async function getLeaderboardByTorneo(grupoId: string): Promise<LeaderboardRow[]> {
  const { data, error } = await supabaseAdmin
    .from('leaderboard')
    .select('*')
    .eq('grupo_id', grupoId)
    .order('posicion', { ascending: true })

  if (error) throw error
  return data ?? []
}
