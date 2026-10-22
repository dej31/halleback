import { useEffect, useMemo, useState } from 'react'
import type { Match } from '@/models'
import { estimateMatchStarts } from '@/algorithms/estimate'

const REFRESH_MS = 30_000

/** Horaires estimés des matchs à venir, recalculés à chaque changement de
 * données et toutes les 30 s (pour suivre un match en cours qui déborde). */
export function useEstimatedStarts(
  matches: Match[],
  transitionDuration: number,
): Record<string, string> {
  const [now, setNow] = useState(() => new Date().toISOString())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().toISOString()), REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  return useMemo(
    () => estimateMatchStarts(matches, transitionDuration, now),
    [matches, transitionDuration, now],
  )
}
