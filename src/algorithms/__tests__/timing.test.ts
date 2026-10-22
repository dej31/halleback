import { describe, expect, it } from 'vitest'
import { calculateTournamentTiming, estimateTournamentEnd, scheduleSegments } from '../timing'
import { combineDateAndTime } from '@/utils/time'

describe('scheduleSegments', () => {
  it('places segments back to back with transition gaps', () => {
    const segments = scheduleSegments(900, [6, 6, 6], 1)
    expect(segments).toEqual([
      { startMinutes: 900, endMinutes: 906 },
      { startMinutes: 907, endMinutes: 913 },
      { startMinutes: 914, endMinutes: 920 },
    ])
  })
})

describe('estimateTournamentEnd', () => {
  it('is internally consistent: total elapsed = sum(durations) + transitions between matches', () => {
    const poolMatchCount = 18
    const poolMatchDuration = 6
    const semiFinalDuration = 8
    const finalDuration = 10
    const transitionDuration = 1

    const estimate = estimateTournamentEnd({
      startTime: '15:30',
      poolMatchCount,
      poolMatchDuration,
      semiFinalDuration,
      finalDuration,
      transitionDuration,
    })

    const totalMatches = poolMatchCount + 2 + 1
    const totalDuration =
      poolMatchCount * poolMatchDuration + 2 * semiFinalDuration + finalDuration
    const totalTransitions = (totalMatches - 1) * transitionDuration
    const expectedEndMinutes = 15 * 60 + 30 + totalDuration + totalTransitions

    expect(estimate.endMinutes).toBe(expectedEndMinutes)
  })

  it('stays chronological: final start is always before or equal to end', () => {
    const estimate = estimateTournamentEnd({
      startTime: '15:30',
      poolMatchCount: 24,
      poolMatchDuration: 5,
      semiFinalDuration: 7,
      finalDuration: 9,
      transitionDuration: 0,
    })
    expect(estimate.finalStartMinutes).toBeLessThanOrEqual(estimate.endMinutes)
  })
})

describe('calculateTournamentTiming', () => {
  it('produces strictly chronological scheduled starts', () => {
    const matches = [
      { id: 'a', plannedDuration: 6, orderIndex: 0 },
      { id: 'b', plannedDuration: 6, orderIndex: 1 },
      { id: 'c', plannedDuration: 6, orderIndex: 2 },
    ]
    const timing = calculateTournamentTiming(matches, '2026-08-29', '15:30', 1)
    const times = matches.map((m) => new Date(timing[m.id]).getTime())
    expect(times[0]).toBeLessThan(times[1])
    expect(times[1]).toBeLessThan(times[2])
  })
})

describe('combineDateAndTime', () => {
  it('returns a full UTC timestamp matching the local wall-clock time', () => {
    const iso = combineDateAndTime('2026-08-29', '15:30')
    expect(iso.endsWith('Z')).toBe(true)
    const d = new Date(iso)
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 8, 29])
    expect([d.getHours(), d.getMinutes()]).toEqual([15, 30])
  })
})
