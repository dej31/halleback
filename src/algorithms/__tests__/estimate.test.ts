import { describe, expect, it } from 'vitest'
import type { Match } from '@/models'
import { estimateMatchStarts } from '../estimate'

const T = (hhmm: string) => `2026-06-20T${hhmm}:00.000Z`

function match(i: number, overrides: Partial<Match> = {}): Match {
  return {
    id: `m${i}`,
    tournamentId: 't1',
    type: 'pool',
    teamAId: `a${i}`,
    teamBId: `b${i}`,
    // Planning théorique : un match toutes les 10 min (6 min + 4 min de marge)
    scheduledStart: T(`14:${String(i * 10).padStart(2, '0')}`),
    plannedDuration: 6,
    status: 'scheduled',
    orderIndex: i,
    ...overrides,
  }
}

describe('estimateMatchStarts', () => {
  it('keeps the planned times when the tournament is on schedule', () => {
    const matches = [match(0), match(1), match(2)]
    expect(estimateMatchStarts(matches, 1, T('13:50'))).toEqual({
      m0: T('14:00'),
      m1: T('14:10'),
      m2: T('14:20'),
    })
  })

  it('pushes back following matches when the live match started late', () => {
    const matches = [
      match(0, { status: 'live', actualStart: T('14:15') }),
      match(1),
      match(2),
    ]
    // fin prévue 14:21 + 1 min de transition -> 14:22, puis 14:22 + 6 + 1 = 14:29
    expect(estimateMatchStarts(matches, 1, T('14:16'))).toEqual({
      m1: T('14:22'),
      m2: T('14:29'),
    })
  })

  it('accounts for a live match running over its planned duration', () => {
    const matches = [match(0, { status: 'live', actualStart: T('14:00') }), match(1)]
    // le match aurait dû finir à 14:06, il est 14:12 et il continue
    expect(estimateMatchStarts(matches, 1, T('14:12'))).toEqual({ m1: T('14:13') })
  })

  it('never announces a match earlier than planned', () => {
    const matches = [
      match(0, { status: 'finished', actualStart: T('14:00'), actualEnd: T('14:06') }),
      match(1),
    ]
    expect(estimateMatchStarts(matches, 1, T('14:06'))).toEqual({ m1: T('14:10') })
  })

  it('uses the current time when the next match is waiting to be started', () => {
    const matches = [
      match(0, { status: 'finished', actualStart: T('14:00'), actualEnd: T('14:06') }),
      match(1),
      match(2),
    ]
    expect(estimateMatchStarts(matches, 1, T('14:30'))).toEqual({
      m1: T('14:30'),
      m2: T('14:37'),
    })
  })
})
