import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Match, Team } from '@/models'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { diffMinutes, formatClock } from '@/utils/time'
import { MatchTime, Panel } from '@/components'

export function MyTeamWidget({
  slug,
  teams,
  matches,
  teamsById,
  estimates = {},
}: {
  slug: string
  teams: Team[]
  matches: Match[]
  teamsById: Map<string, Team>
  /** Horaires estimés des matchs à venir, par id de match */
  estimates?: Record<string, string>
}) {
  const [myTeamId, setMyTeamId] = useLocalStorage<string | null>(
    `halleback:my-team:${slug}`,
    null,
  )
  const [query, setQuery] = useState('')

  const myTeam = myTeamId ? teamsById.get(myTeamId) : undefined

  const myMatches = useMemo(() => {
    if (!myTeamId) return []
    return matches
      .filter((m) => m.teamAId === myTeamId || m.teamBId === myTeamId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [matches, myTeamId])

  const nextMatch = myMatches.find((m) => m.status !== 'finished')
  const nextStart = nextMatch ? (estimates[nextMatch.id] ?? nextMatch.scheduledStart) : undefined

  if (!myTeam) {
    const filtered = teams.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()),
    )
    return (
      <Panel className="p-4">
        <p className="mb-2 font-display text-lg font-bold text-cream">
          🔍 Trouver mon équipe
        </p>
        <div className="relative mb-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Les Pompoms…"
            className="w-full rounded border-2 border-cream/20 bg-ink py-2.5 pl-9 pr-3 text-cream outline-none focus:border-gold"
          />
        </div>
        {query && (
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMyTeamId(t.id)
                    setQuery('')
                  }}
                  className="min-h-11 w-full rounded px-3 py-2 text-left text-cream hover:bg-cream/10"
                >
                  {t.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-cream/50">Aucune équipe trouvée.</li>
            )}
          </ul>
        )}
      </Panel>
    )
  }

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-lg font-bold text-cream">{myTeam.name}</p>
        <button
          type="button"
          onClick={() => setMyTeamId(null)}
          className="text-sm text-cream/50 underline underline-offset-2"
        >
          Changer
        </button>
      </div>

      {nextMatch && (
        <div className="mb-4">
          <p className="font-hand text-xl text-gold">Mon prochain match</p>
          <p className="font-display text-2xl font-bold text-cream">
            {formatClock(nextStart!)} —{' '}
            {teamsById.get(nextMatch.teamAId)?.name} vs{' '}
            {teamsById.get(nextMatch.teamBId)?.name}
          </p>
          {nextMatch.status === 'scheduled' && (
            <p className="text-sm text-cream/60">
              {nextStart !== nextMatch.scheduledStart && estimates[nextMatch.id] ? 'Estimé dans' : 'Dans'}{' '}
              {Math.max(0, Math.round(diffMinutes(nextStart!, new Date().toISOString())))} min
            </p>
          )}
        </div>
      )}

      <p className="mb-1 font-hand text-xl text-gold">Mes matchs</p>
      <ul className="flex flex-col gap-1 text-sm">
        {myMatches.map((m) => {
          const isMe = (id: string) => id === myTeamId
          const opponent = teamsById.get(isMe(m.teamAId) ? m.teamBId : m.teamAId)
          return (
            <li key={m.id} className="flex items-center gap-2 text-cream/80">
              <span>{m.status === 'finished' ? '✓' : m.status === 'live' ? '🔥' : '→'}</span>
              <MatchTime
                scheduledStart={m.scheduledStart}
                estimatedStart={estimates[m.id]}
                className="w-12 text-cream/50"
              />
              <span>
                vs {opponent?.name}
                {m.status === 'finished' &&
                  ` — ${isMe(m.teamAId) ? m.scoreA : m.scoreB} - ${isMe(m.teamAId) ? m.scoreB : m.scoreA}`}
              </span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
