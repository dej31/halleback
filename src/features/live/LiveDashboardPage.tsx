import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart3, Trophy } from 'lucide-react'
import { useTournamentData } from '@/hooks/useTournamentData'
import { calculateDelayMinutes } from '@/algorithms/delay'
import { generateFinal } from '@/algorithms/finals'
import { formatClock } from '@/utils/time'
import { useEstimatedStarts } from '@/hooks/useEstimatedStarts'
import { createMatches, updateTournament } from '@/repositories'
import { Button, PageHeader, Panel, Spinner, StatusPill } from '@/components'
import { MatchCard } from '@/components'
import { LiveMatchPanel } from './LiveMatchPanel'
import { DelayBanner } from './DelayBanner'
import { ChampionScreen } from '@/features/finals/ChampionScreen'

export function LiveDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const { tournament, teams, matches, loading, refetch } = useTournamentData({ id })
  const startedTransition = useRef(false)

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const orderedMatches = useMemo(
    () => [...matches].sort((a, b) => a.orderIndex - b.orderIndex),
    [matches],
  )
  const currentMatch = orderedMatches.find((m) => m.status === 'live')
  const scheduledMatches = orderedMatches.filter((m) => m.status === 'scheduled')
  const nextMatch = scheduledMatches[0]
  const finishedCount = orderedMatches.filter((m) => m.status === 'finished').length
  const poolMatches = orderedMatches.filter((m) => m.type === 'pool')
  const poolsAllFinished =
    poolMatches.length > 0 && poolMatches.every((m) => m.status === 'finished')
  const finalMatch = orderedMatches.find((m) => m.type === 'final')
  const semiFinals = orderedMatches.filter((m) => m.type === 'semifinal')
  const delayMinutes = calculateDelayMinutes(orderedMatches)
  const estimates = useEstimatedStarts(matches, tournament?.settings.transitionDuration ?? 0)
  const createdFinalRef = useRef(false)
  const closedChampionScreenRef = useRef(false)
  const [showChampions, setShowChampions] = useState(false)

  useEffect(() => {
    if (!tournament || startedTransition.current) return
    if (tournament.status === 'published' && (currentMatch || finishedCount > 0)) {
      startedTransition.current = true
      updateTournament(tournament.id, { status: 'running' })
    }
  }, [tournament, currentMatch, finishedCount])

  // Les gagnants des demi-finales alimentent automatiquement la finale
  // (section 26) — aucune validation manuelle nécessaire ici, contrairement
  // à la sélection des qualifiés qui, elle, reste sous contrôle de
  // l'organisateur (QualificationReviewPage).
  useEffect(() => {
    if (!tournament || createdFinalRef.current) return
    if (semiFinals.length !== 2 || finalMatch) return
    const [sf1, sf2] = semiFinals
    const pairing = generateFinal(sf1, sf2)
    if (!pairing) return
    createdFinalRef.current = true
    createMatches([
      {
        tournamentId: tournament.id,
        type: 'final',
        teamAId: pairing.teamAId,
        teamBId: pairing.teamBId,
        scheduledStart: new Date(
          Math.max(
            ...semiFinals.map((m) => new Date(m.actualEnd ?? m.scheduledStart).getTime()),
          ) +
            tournament.settings.transitionDuration * 60_000,
        ).toISOString(),
        plannedDuration: tournament.settings.finalDuration,
        status: 'scheduled',
        orderIndex: orderedMatches.length,
      },
    ]).then(refetch)
  }, [tournament, semiFinals, finalMatch, orderedMatches.length, refetch])

  useEffect(() => {
    if (finalMatch?.status === 'finished' && !closedChampionScreenRef.current) {
      setShowChampions(true)
      if (tournament && tournament.status !== 'finished') {
        updateTournament(tournament.id, { status: 'finished' })
      }
    }
  }, [finalMatch, tournament])

  if (loading || !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (
    showChampions &&
    finalMatch &&
    finalMatch.scoreA !== undefined &&
    finalMatch.scoreB !== undefined
  ) {
    const championId =
      finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamAId : finalMatch.teamBId
    const finalistId =
      finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamBId : finalMatch.teamAId
    return (
      <ChampionScreen
        championName={teamsById.get(championId)?.name ?? '—'}
        finalistName={teamsById.get(finalistId)?.name}
        year={new Date(tournament.date).getFullYear()}
        onClose={() => {
          closedChampionScreenRef.current = true
          setShowChampions(false)
        }}
      />
    )
  }

  const activeOrNext = currentMatch ?? nextMatch

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="En direct"
        title={tournament.name}
        actions={
          <>
            <Link to={`/admin/${tournament.id}`}>
              <Button variant="secondary" size="md">
                <BarChart3 size={18} /> Réglages
              </Button>
            </Link>
            {poolsAllFinished && (
              <Link to={`/admin/${tournament.id}/finals`}>
                <Button size="md">
                  <Trophy size={18} /> Phases finales
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
        <DelayBanner
          delayMinutes={delayMinutes}
          remainingMatches={scheduledMatches}
          transitionDuration={tournament.settings.transitionDuration}
          onApplied={refetch}
        />

        {activeOrNext ? (
          <LiveMatchPanel
            /* Une clé par match : le chrono, la pause et le score saisi
               repartent de zéro à chaque nouveau match au lieu d'hériter
               de l'état du match précédent. */
            key={activeOrNext.id}
            match={activeOrNext}
            teamA={teamsById.get(activeOrNext.teamAId)}
            teamB={teamsById.get(activeOrNext.teamBId)}
            onChanged={refetch}
          />
        ) : (
          <Panel className="p-6 text-center text-cream/70">
            Tous les matchs sont terminés pour l'instant.
          </Panel>
        )}

        {currentMatch && nextMatch && (
          <div>
            <p className="mb-2 font-hand text-xl text-gold">Ensuite</p>
            <MatchCard
              match={nextMatch}
              teamA={teamsById.get(nextMatch.teamAId)}
              teamB={teamsById.get(nextMatch.teamBId)}
              estimatedStart={estimates[nextMatch.id]}
            />
          </div>
        )}

        <Panel className="flex items-center justify-between p-4">
          <div>
            <p className="font-display text-2xl font-bold text-cream">
              {finishedCount} / {orderedMatches.length}
            </p>
            <p className="text-sm text-cream/60">matchs terminés</p>
          </div>
          {finalMatch && (
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-gold">
                {formatClock(estimates[finalMatch.id] ?? finalMatch.scheduledStart)}
              </p>
              <p className="text-sm text-cream/60">finale estimée</p>
            </div>
          )}
          {delayMinutes >= 1 && (
            <StatusPill tone="warning">+{Math.round(delayMinutes)} min</StatusPill>
          )}
        </Panel>
      </div>
    </div>
  )
}
