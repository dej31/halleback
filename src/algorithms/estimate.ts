import type { Match } from '@/models'
import { addMinutesToISO } from '@/utils/time'

function laterOf(isoA: string, isoB: string): string {
  return new Date(isoA).getTime() >= new Date(isoB).getTime() ? isoA : isoB
}

/** Horaires estimés des matchs à venir, recalculés à partir de la situation
 * réelle du terrain (match en cours, dernier match terminé, heure actuelle)
 * puis enchaînés dans l'ordre de passage avec le temps de transition.
 *
 * - Un match n'est jamais annoncé plus tôt que son horaire prévu.
 * - Un match en cours qui déborde repousse tout ce qui suit.
 * - Les matchs terminés ou en cours n'ont pas d'estimation.
 *
 * Les horaires prévus (scheduledStart) ne sont jamais modifiés : on garde la
 * trace du planning initial, l'estimation est purement calculée. */
export function estimateMatchStarts(
  matches: Match[],
  transitionDuration: number,
  nowISO: string,
): Record<string, string> {
  const ordered = [...matches].sort((a, b) => a.orderIndex - b.orderIndex)
  const live = ordered.find((m) => m.status === 'live' && m.actualStart)

  let cursor: string
  if (live) {
    const plannedEnd = addMinutesToISO(live.actualStart!, live.plannedDuration)
    cursor = addMinutesToISO(laterOf(plannedEnd, nowISO), transitionDuration)
  } else {
    const lastEnd = ordered
      .filter((m) => m.status === 'finished' && m.actualEnd)
      .map((m) => m.actualEnd!)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    cursor = lastEnd
      ? laterOf(addMinutesToISO(lastEnd, transitionDuration), nowISO)
      : nowISO
  }

  const estimates: Record<string, string> = {}
  for (const match of ordered) {
    if (match.status === 'live' || match.status === 'finished') continue
    const start = laterOf(cursor, match.scheduledStart)
    estimates[match.id] = start
    cursor = addMinutesToISO(start, match.plannedDuration + transitionDuration)
  }
  return estimates
}
