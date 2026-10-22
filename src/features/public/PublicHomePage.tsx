import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { usePublicTournamentData } from './PublicLayout'
import { MatchCard, StatusPill } from '@/components'
import { MyTeamWidget } from './MyTeamWidget'
import { useEstimatedStarts } from '@/hooks/useEstimatedStarts'

export function PublicHomePage() {
  const { tournament, teams, matches } = usePublicTournamentData()
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const orderedMatches = useMemo(
    () => [...matches].sort((a, b) => a.orderIndex - b.orderIndex),
    [matches],
  )
  const liveMatch = orderedMatches.find((m) => m.status === 'live')
  const nextMatch = orderedMatches.find((m) => m.status === 'scheduled')
  const finalMatch = orderedMatches.find((m) => m.type === 'final')
  const estimates = useEstimatedStarts(
    matches,
    tournament?.settings.transitionDuration ?? 0,
  )

  if (!tournament) return null

  const beforeStart = tournament.status === 'published'
  const finished = tournament.status === 'finished'

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 sm:px-6">
      <header className="text-center">
        <p className="font-hand text-2xl text-gold">Challenge</p>
        <h1 className="font-display text-4xl font-black text-cream">Halle Back</h1>
      </header>

      {finished && finalMatch && finalMatch.scoreA !== undefined && (
        <div className="rounded border-2 border-gold/60 bg-gold/10 p-5 text-center">
          <Trophy className="mx-auto mb-2 text-gold" size={32} />
          <p className="font-hand text-xl text-gold">
            Champions {new Date(tournament.date).getFullYear()}
          </p>
          <p className="font-display text-3xl font-bold text-cream">
            {
              teamsById.get(
                finalMatch.scoreA! > finalMatch.scoreB!
                  ? finalMatch.teamAId
                  : finalMatch.teamBId,
              )?.name
            }
          </p>
        </div>
      )}

      {beforeStart && (
        <div className="rounded border-2 border-cream/15 bg-ink-soft p-5 text-center">
          <p className="text-cream/70">
            {new Date(tournament.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <p className="font-display text-2xl font-bold text-cream">
            Début à {tournament.startTime}
          </p>
          <p className="mt-1 text-cream/60">{teams.length} équipes — le tournoi commencera bientôt.</p>
        </div>
      )}

      {liveMatch && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill tone="live">🔥 En ce moment</StatusPill>
          </div>
          <MatchCard
            match={liveMatch}
            teamA={teamsById.get(liveMatch.teamAId)}
            teamB={teamsById.get(liveMatch.teamBId)}
          />
        </section>
      )}

      {nextMatch && (
        <section>
          <p className="mb-2 font-hand text-xl text-gold">⏭ Ensuite</p>
          <MatchCard
            match={nextMatch}
            teamA={teamsById.get(nextMatch.teamAId)}
            teamB={teamsById.get(nextMatch.teamBId)}
            estimatedStart={estimates[nextMatch.id]}
          />
        </section>
      )}

      <MyTeamWidget
        slug={tournament.slug}
        teams={teams}
        matches={matches}
        teamsById={teamsById}
        estimates={estimates}
      />

      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm font-semibold">
        <Link
          to={`/tournoi/${tournament.slug}/matchs`}
          className="rounded border-2 border-cream/15 py-3 text-cream/80"
        >
          Planning
        </Link>
        <Link
          to={`/tournoi/${tournament.slug}/classement`}
          className="rounded border-2 border-cream/15 py-3 text-cream/80"
        >
          Classement
        </Link>
        <Link
          to={`/tournoi/${tournament.slug}/finales`}
          className="rounded border-2 border-cream/15 py-3 text-cream/80"
        >
          Finales
        </Link>
      </div>
    </div>
  )
}
