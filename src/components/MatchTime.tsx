import { diffMinutes, formatClock } from '@/utils/time'

/** En dessous de cet écart, on n'affiche que l'horaire prévu. */
const SHOW_ESTIMATE_THRESHOLD_MIN = 2

/** Affiche l'horaire d'un match : l'horaire prévu seul s'il est tenu, ou
 * l'horaire estimé mis en avant avec l'horaire prévu barré en dessous. */
export function MatchTime({
  scheduledStart,
  estimatedStart,
  className = '',
}: {
  scheduledStart: string
  estimatedStart?: string
  className?: string
}) {
  const shifted =
    estimatedStart !== undefined &&
    Math.abs(diffMinutes(estimatedStart, scheduledStart)) >= SHOW_ESTIMATE_THRESHOLD_MIN

  if (!shifted) {
    return <span className={`tabular-nums ${className}`}>{formatClock(scheduledStart)}</span>
  }

  return (
    <span className={`inline-flex flex-col leading-tight tabular-nums ${className}`}>
      <span title="Horaire estimé">~{formatClock(estimatedStart!)}</span>
      <span className="text-[11px] font-normal text-cream/40 line-through">
        {formatClock(scheduledStart)}
      </span>
    </span>
  )
}
