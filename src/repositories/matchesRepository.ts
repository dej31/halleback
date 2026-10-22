import { supabase } from '@/services/supabaseClient'
import type { Match } from '@/models'
import { matchFromRow, matchToRow } from './mappers'

export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return (data ?? []).map(matchFromRow)
}

export async function replacePoolMatches(
  tournamentId: string,
  matches: Match[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('type', 'pool')
  if (deleteError) throw deleteError

  if (matches.length === 0) return
  const { error: insertError } = await supabase
    .from('matches')
    .insert(matches.map((m) => matchToRow({ ...m, tournamentId })))
  if (insertError) throw insertError
}

export async function createMatches(matches: Partial<Match>[]): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .insert(matches.map((m) => matchToRow(m)))
    .select('*')
  if (error) throw error
  return (data ?? []).map(matchFromRow)
}

export async function updateMatch(id: string, patch: Partial<Match>): Promise<Match> {
  // matchToRow est pensé pour l'insertion : il force order_index à 0 quand
  // il n'est pas fourni. Sur une mise à jour partielle (démarrage, score,
  // fin de match), on ne doit surtout pas écraser l'ordre de passage.
  const { order_index, ...rest } = matchToRow(patch)
  const row = patch.orderIndex === undefined ? rest : { ...rest, order_index }
  const { data, error } = await supabase
    .from('matches')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return matchFromRow(data)
}

export async function startMatch(id: string): Promise<Match> {
  return updateMatch(id, { status: 'live', actualStart: new Date().toISOString() })
}

export async function finishMatch(
  id: string,
  scoreA: number,
  scoreB: number,
): Promise<Match> {
  return updateMatch(id, {
    status: 'finished',
    scoreA,
    scoreB,
    actualEnd: new Date().toISOString(),
  })
}

export async function rescheduleMatch(
  id: string,
  patch: Pick<Match, 'scheduledStart'> & Partial<Pick<Match, 'plannedDuration'>>,
): Promise<Match> {
  return updateMatch(id, patch)
}
