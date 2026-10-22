export type TournamentStatus =
  | 'draft'
  | 'published'
  | 'running'
  | 'finals'
  | 'finished'

export interface TournamentSettings {
  /** Durée d'un match de poule, en minutes (valeur "ronde": 4,5,6,7,8,9,10,12) */
  poolMatchDuration: number
  /** Durée d'une demi-finale, en minutes */
  semiFinalDuration: number
  /** Durée de la finale, en minutes */
  finalDuration: number
  /** Temps de transition entre deux matchs, en minutes (peut être 0 ou 0.5) */
  transitionDuration: number
  pointsWin: number
  pointsDraw: number
  pointsLoss: number
}

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  poolMatchDuration: 6,
  semiFinalDuration: 8,
  finalDuration: 10,
  transitionDuration: 5,
  pointsWin: 3,
  pointsDraw: 2,
  pointsLoss: 1,
}

export interface Tournament {
  id: string
  slug: string
  name: string
  /** Date ISO (YYYY-MM-DD) */
  date: string
  /** Heure de début, format "HH:mm" */
  startTime: string
  /** Heure de fin souhaitée, format "HH:mm" */
  targetEndTime: string
  status: TournamentStatus
  settings: TournamentSettings
  ownerId: string
  createdAt: string
  updatedAt: string
}

export const DEFAULT_NEW_TOURNAMENT = {
  name: 'Challenge Halle Back',
  startTime: '15:30',
  targetEndTime: '20:00',
}
