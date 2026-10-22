import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTournamentData } from '@/hooks/useTournamentData'
import { formatClock } from '@/utils/time'
import { useEstimatedStarts } from '@/hooks/useEstimatedStarts'
import { BigScore, Spinner } from '@/components'

/** Écran grand format (section 52), pensé pour être projeté ou affiché sur
 * une TV sous la Halle : lisible à distance, entièrement automatique. */
export function DisplayScreen() {
  const { slug } = useParams<{ slug: string }>()
  const { tournament, teams, matches, loading } = useTournamentData({ slug })

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const ordered = useMemo(
    () => [...matches].sort((a, b) => a.orderIndex - b.orderIndex),
    [matches],
  )
  const liveMatch = ordered.find((m) => m.status === 'live')
  const nextMatch = ordered.find((m) => m.status === 'scheduled')
  const finishedCount = ordered.filter((m) => m.status === 'finished').length
  const estimates = useEstimatedStarts(matches, tournament?.settings.transitionDuration ?? 0)

  if (loading || !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-ink px-8 py-10 text-center">
      <h1 className="font-display text-4xl font-black text-cream sm:text-5xl">
        Challenge <span className="text-gold">Halle Back</span>
      </h1>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {liveMatch ? (
          <>
            <p className="font-hand text-4xl text-gold">En ce moment</p>
            <div className="flex items-center gap-10">
              <BigScore
                teamName={teamsById.get(liveMatch.teamAId)?.name ?? '—'}
                score={liveMatch.scoreA ?? 0}
                emphasis
              />
              <span className="font-display text-5xl text-cream/30">–</span>
              <BigScore
                teamName={teamsById.get(liveMatch.teamBId)?.name ?? '—'}
                score={liveMatch.scoreB ?? 0}
                emphasis
              />
            </div>
          </>
        ) : (
          <p className="font-display text-3xl text-cream/60">
            Prochain coup d'envoi dans un instant…
          </p>
        )}

        {nextMatch && (
          <div className="mt-6">
            <p className="font-hand text-2xl text-gold">Prochain match</p>
            <p className="font-display text-3xl font-bold text-cream">
              {formatClock(estimates[nextMatch.id] ?? nextMatch.scheduledStart)} —{' '}
              {teamsById.get(nextMatch.teamAId)?.name} vs{' '}
              {teamsById.get(nextMatch.teamBId)?.name}
            </p>
          </div>
        )}
      </div>

      <p className="font-display text-xl text-cream/50">
        {finishedCount} / {ordered.length} matchs terminés
      </p>
    </div>
  )
}
