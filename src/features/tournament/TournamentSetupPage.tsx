import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QrCode, Radio, Share2, Sparkles } from 'lucide-react'
import { useTournamentData } from '@/hooks/useTournamentData'
import { findBestTournamentFormat } from '@/algorithms/format'
import { generateTournamentPlan } from '@/algorithms/tournamentPlan'
import type { TournamentFormatRecommendation, TeamCategory, TeamLevel } from '@/models'
import {
  assignTeamsToPools,
  createTeam,
  deleteTeam as deleteTeamRepo,
  markTeamForfeit,
  replacePoolMatches,
  replacePools,
  updateTeam,
  updateTournament,
} from '@/repositories'
import { Button, PageHeader, Panel, Section, Spinner } from '@/components'
import { TeamQuickAddForm } from '@/features/teams/TeamQuickAddForm'
import { TeamList } from '@/features/teams/TeamList'
import { FormatSimulationScreen } from '@/features/scheduling/FormatSimulationScreen'
import { PoolsPreview } from '@/features/pools/PoolsPreview'
import { shareOrCopy } from '@/utils/share'
import { formatClock } from '@/utils/time'

const TRANSITION_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10]

export function TournamentSetupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tournament, teams, pools, matches, loading, error, refetch } =
    useTournamentData({ id })

  const [view, setView] = useState<'setup' | 'simulate'>('setup')
  const [recommendation, setRecommendation] = useState<{
    recommended: TournamentFormatRecommendation
    alternatives: TournamentFormatRecommendation[]
  } | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const activeTeams = useMemo(() => teams.filter((t) => t.status !== 'forfeit'), [teams])
  const poolMatches = useMemo(
    () => matches.filter((m) => m.type === 'pool').sort((a, b) => a.orderIndex - b.orderIndex),
    [matches],
  )
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !tournament) {
    return <p className="p-6 text-cream">{error ?? 'Tournoi introuvable.'}</p>
  }

  async function handleAddTeam(data: { name: string; category: TeamCategory; level?: TeamLevel }) {
    await createTeam({ tournamentId: tournament!.id, ...data, status: 'active' })
    refetch()
  }

  async function handleDeleteTeam(teamId: string) {
    await deleteTeamRepo(teamId)
    refetch()
  }

  async function handleToggleForfeit(teamId: string) {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return
    if (team.status === 'forfeit') await updateTeam(teamId, { status: 'active' })
    else await markTeamForfeit(teamId)
    refetch()
  }

  async function handleTransitionChange(minutes: number) {
    if (!tournament) return
    await updateTournament(tournament.id, {
      settings: { ...tournament.settings, transitionDuration: minutes },
    })
    refetch()
  }

  function handleGenerate() {
    if (!tournament) return
    setFormatError(null)
    try {
      const result = findBestTournamentFormat(activeTeams, {
        startTime: tournament.startTime,
        targetEndTime: tournament.targetEndTime,
        transitionDuration: tournament.settings.transitionDuration,
      })
      setRecommendation(result)
      setView('simulate')
    } catch (e) {
      setFormatError(e instanceof Error ? e.message : 'Format impossible à calculer.')
    }
  }

  async function handleConfirmFormat(choice: TournamentFormatRecommendation) {
    if (!tournament) return
    setBusy(true)
    try {
      const plan = generateTournamentPlan(tournament, activeTeams, choice.scenario)
      await replacePools(
        tournament.id,
        plan.pools.map((p) => ({ ...p, tournamentId: tournament.id })),
      )
      await assignTeamsToPools(
        Object.entries(plan.teamPoolAssignment).map(([teamId, poolId]) => ({
          teamId,
          poolId,
        })),
      )
      await replacePoolMatches(
        tournament.id,
        plan.matches.map((m) => ({ ...m, tournamentId: tournament.id })),
      )
      await refetch()
      setView('setup')
    } finally {
      setBusy(false)
    }
  }

  async function handlePublish() {
    if (!tournament) return
    await updateTournament(tournament.id, { status: 'published' })
    refetch()
  }

  async function handleShare() {
    await shareOrCopy({
      title: tournament!.name,
      url: `${window.location.origin}${import.meta.env.BASE_URL}tournoi/${tournament!.slug}`,
    })
  }

  if (view === 'simulate' && recommendation) {
    return (
      <FormatSimulationScreen
        recommended={recommendation.recommended}
        alternatives={recommendation.alternatives}
        teamCount={activeTeams.length}
        startTime={tournament.startTime}
        targetEndTime={tournament.targetEndTime}
        confirming={busy}
        onCancel={() => setView('setup')}
        onConfirm={handleConfirmFormat}
      />
    )
  }

  const hasPlan = pools.length > 0 && poolMatches.length > 0

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Organisateur"
        title={tournament.name}
        subtitle={`${tournament.date} · ${tournament.startTime} → ${tournament.targetEndTime}`}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={handleShare}>
              <Share2 size={18} /> Partager
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/admin/${tournament.id}/qr`)}
            >
              <QrCode size={18} /> QR
            </Button>
            {hasPlan && (
              <Button size="md" onClick={() => navigate(`/admin/${tournament.id}/live`)}>
                <Radio size={18} /> Live
              </Button>
            )}
          </>
        }
      />

      <Section title="Équipes">
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamQuickAddForm onAdd={handleAddTeam} />
          <TeamList
            teams={teams}
            onDelete={handleDeleteTeam}
            onToggleForfeit={handleToggleForfeit}
          />
        </div>
      </Section>

      <Section title="Format & planning">
        {formatError && (
          <p className="mb-3 rounded border-2 border-accent-red/50 bg-accent-red/10 px-3 py-2 text-sm text-cream">
            {formatError}
          </p>
        )}

        <Panel className="mb-4 flex flex-wrap items-center gap-3 p-4">
          <label htmlFor="transition-duration" className="font-semibold text-cream">
            Temps entre deux matchs
          </label>
          <select
            id="transition-duration"
            value={tournament.settings.transitionDuration}
            onChange={(e) => handleTransitionChange(Number(e.target.value))}
            className="rounded border-2 border-cream/20 bg-ink px-3 py-1.5 text-cream"
          >
            {TRANSITION_OPTIONS.map((min) => (
              <option key={min} value={min}>
                {min === 0 ? 'Aucun' : `${min} min`}
              </option>
            ))}
          </select>
          {hasPlan && (
            <p className="w-full text-sm text-cream/60">
              Cliquez sur « Régénérer » pour recalculer le planning et la durée des
              matchs avec ce temps de pause.
            </p>
          )}
        </Panel>

        {!hasPlan ? (
          <Panel className="flex flex-col items-center gap-3 p-6 text-center">
            <Sparkles className="text-gold" size={28} />
            <p className="text-cream/80">
              {activeTeams.length < 4
                ? 'Ajoutez au moins 4 équipes pour générer le tournoi.'
                : `${activeTeams.length} équipes prêtes. On génère les poules et le planning ?`}
            </p>
            <Button onClick={handleGenerate} disabled={activeTeams.length < 4}>
              Générer le tournoi
            </Button>
          </Panel>
        ) : (
          <div className="flex flex-col gap-4">
            <PoolsPreview pools={pools} teams={teams} />

            <div>
              <p className="mb-2 font-display text-lg font-bold text-cream">
                Planning ({poolMatches.length} matchs de poule)
              </p>
              <ol className="flex flex-col gap-1.5 text-sm">
                {poolMatches.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded border border-cream/10 bg-ink-soft px-3 py-1.5"
                  >
                    <span className="w-6 shrink-0 text-cream/40">{i + 1}</span>
                    <span className="w-14 shrink-0 font-semibold text-gold tabular-nums">
                      {formatClock(m.scheduledStart)}
                    </span>
                    <span className="flex-1 truncate text-cream/90">
                      {teamsById.get(m.teamAId)?.name} vs {teamsById.get(m.teamBId)?.name}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleGenerate}>
                Régénérer
              </Button>
              {tournament.status === 'draft' && (
                <Button onClick={handlePublish}>Publier le tournoi</Button>
              )}
              {tournament.status !== 'draft' && (
                <Button onClick={() => navigate(`/admin/${tournament.id}/live`)}>
                  Aller au direct
                </Button>
              )}
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
