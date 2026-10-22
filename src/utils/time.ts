/** Utilitaires de temps "horloge" (HH:mm, minutes depuis minuit), utilisés
 * par les algorithmes de format/planning qui raisonnent en durées avant
 * même que des horodatages réels (ISO) n'existent. */

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(totalMinutes: number): string {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Date + heure locale (celle de l'organisateur) -> ISO complet en UTC.
 * Une chaîne sans fuseau ("2026-08-29T15:30:00") serait lue comme de l'UTC
 * par la base de données : le premier match se retrouvait décalé de 1 ou 2 h. */
export function combineDateAndTime(dateISO: string, hhmm: string): string {
  const minutes = timeToMinutes(hhmm)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const [year, month, day] = dateISO.split('-').map(Number)
  return new Date(year, month - 1, day, h, m).toISOString()
}

export function addMinutesToISO(iso: string, minutes: number): string {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

export function diffMinutes(isoA: string, isoB: string): number {
  return (new Date(isoA).getTime() - new Date(isoB).getTime()) / 60000
}

export function formatClock(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
