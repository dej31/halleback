import { useMemo } from 'react'
import { usePublicTournamentData } from './PublicLayout'
import { MatchTime, PageHeader } from '@/components'
import { useEstimatedStarts } from '@/hooks/useEstimatedStarts'

export function PublicMatchesPage() {
  const { tournament, teams, matches } = usePublicTournamentData()
  const estimates = useEstimatedStarts(matches, tournament?.settings.transitionDuration ?? 0)
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const ordered = useMemo(
    () => [...matches].sort((a, b) => a.orderIndex - b.orderIndex),
    [matches],
  )

  return (
    <div className="pb-4">
      <PageHeader title="Planning" />
      <ol className="flex flex-col gap-2 px-4 py-4 sm:px-6">
        {ordered.map((m) => (
          <li
            key={m.id}
            className={[
              'flex items-center gap-3 rounded border-2 px-3 py-2.5',
              m.status === 'live'
                ? 'border-accent-red bg-accent-red/10'
                : 'border-cream/15 bg-ink-soft',
            ].join(' ')}
          >
            <MatchTime
              scheduledStart={m.scheduledStart}
              estimatedStart={estimates[m.id]}
              className="w-14 shrink-0 font-display font-bold text-gold"
            />
            <span className="text-lg">
              {m.status === 'finished' ? '✓' : m.status === 'live' ? '🔥' : '→'}
            </span>
            <span className="flex-1 truncate text-cream/90">
              {teamsById.get(m.teamAId)?.name} vs {teamsById.get(m.teamBId)?.name}
              {m.type !== 'pool' && (
                <span className="ml-2 text-xs uppercase text-gold">
                  {m.type === 'semifinal' ? 'Demie' : 'Finale'}
                </span>
              )}
            </span>
            {m.status === 'finished' && (
              <span className="shrink-0 font-display font-bold text-cream tabular-nums">
                {m.scoreA} - {m.scoreB}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
