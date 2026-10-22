import type { Match, Team } from '@/models'
import { MatchTime } from './MatchTime'
import { StatusPill } from './StatusPill'

const TYPE_LABEL: Record<Match['type'], string> = {
  pool: '',
  semifinal: 'Demi-finale',
  final: 'Finale',
}

export function MatchCard({
  match,
  teamA,
  teamB,
  poolName,
  highlight = false,
  estimatedStart,
}: {
  match: Match
  teamA?: Team
  teamB?: Team
  poolName?: string
  highlight?: boolean
  /** Horaire estimé (voir estimateMatchStarts), affiché s'il s'écarte du prévu */
  estimatedStart?: string
}) {
  const isLive = match.status === 'live'
  const isDone = match.status === 'finished'
  const label = TYPE_LABEL[match.type]

  return (
    <div
      className={[
        'flex items-center gap-3 rounded border-2 px-3 py-3',
        isLive
          ? 'border-accent-red bg-accent-red/10'
          : highlight
            ? 'border-gold/60 bg-ink-soft'
            : 'border-cream/15 bg-ink-soft',
      ].join(' ')}
    >
      <div className="w-14 shrink-0 text-center">
        <MatchTime
          scheduledStart={match.scheduledStart}
          estimatedStart={estimatedStart}
          className="font-display text-lg font-bold text-cream"
        />
        {(label || poolName) && (
          <span className="block text-[11px] uppercase tracking-wide text-cream/50">
            {label || poolName}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <span className="flex-1 truncate text-sm font-semibold text-cream sm:text-base">
          {teamA?.name ?? '—'}
        </span>
        {isDone || isLive ? (
          <span className="shrink-0 font-display text-xl font-bold tabular-nums text-gold">
            {match.scoreA ?? 0} – {match.scoreB ?? 0}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold uppercase text-cream/40">vs</span>
        )}
        <span className="flex-1 truncate text-right text-sm font-semibold text-cream sm:text-base">
          {teamB?.name ?? '—'}
        </span>
      </div>

      <div className="w-16 shrink-0 text-right">
        {isLive && <StatusPill tone="live">Live</StatusPill>}
        {isDone && <StatusPill tone="done">Fini</StatusPill>}
      </div>
    </div>
  )
}
