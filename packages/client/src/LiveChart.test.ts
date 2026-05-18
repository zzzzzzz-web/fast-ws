import { describe, it, expect } from 'vitest'
import type { PricePoint } from './LiveChart'

function dedup(data: PricePoint[]) {
  const bySecond = new Map<number, number>()
  for (const p of data) {
    bySecond.set(Math.floor(p.timestamp / 1000), p.price)
  }
  return [...bySecond.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time, value }))
}

describe('price deduplication', () => {
  it('keeps one point per second, using the latest price', () => {
    const data: PricePoint[] = [
      { price: 100, timestamp: 1000 },
      { price: 110, timestamp: 1500 },
    ]
    const result = dedup(data)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(110)
  })

  it('preserves distinct seconds as separate points', () => {
    const data: PricePoint[] = [
      { price: 100, timestamp: 1000 },
      { price: 200, timestamp: 2000 },
      { price: 300, timestamp: 3000 },
    ]
    expect(dedup(data)).toHaveLength(3)
  })

  it('sorts points by time ascending', () => {
    const data: PricePoint[] = [
      { price: 300, timestamp: 3000 },
      { price: 100, timestamp: 1000 },
      { price: 200, timestamp: 2000 },
    ]
    const result = dedup(data)
    expect(result.map((p) => p.value)).toEqual([100, 200, 300])
  })

  it('returns empty array for empty input', () => {
    expect(dedup([])).toEqual([])
  })
})
