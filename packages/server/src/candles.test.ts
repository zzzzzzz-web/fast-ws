import { describe, it, expect, vi } from 'vitest'
import { createCandleAccumulator } from './candles.js'
import type { Trade } from './types.js'

const MIN = 60_000

function trade(price: number, volume: number, timestamp: number): Trade {
  return { price, volume, timestamp, buyerMaker: false }
}

describe('createCandleAccumulator', () => {
  it('does not emit until a new minute arrives', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1, MIN))
    acc(trade(110, 1, MIN + 1000))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('emits a candle when the minute rolls over', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1, MIN))
    acc(trade(110, 1, MIN + 1000))
    acc(trade(95, 1, MIN * 2))

    expect(onClose).toHaveBeenCalledOnce()
    const candle = onClose.mock.calls[0][0]
    expect(candle.open).toBe(100)
    expect(candle.close).toBe(110)
    expect(candle.high).toBe(110)
    expect(candle.low).toBe(100)
    expect(candle.volume).toBeCloseTo(2)
  })

  it('sets correct OHLCV for a single trade', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(50, 2.5, MIN))
    acc(trade(999, 1, MIN * 2))

    const candle = onClose.mock.calls[0][0]
    expect(candle.open).toBe(50)
    expect(candle.high).toBe(50)
    expect(candle.low).toBe(50)
    expect(candle.close).toBe(50)
    expect(candle.volume).toBe(2.5)
  })

  it('tracks high and low correctly across multiple trades', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1, MIN))
    acc(trade(200, 1, MIN + 1000))
    acc(trade(50, 1, MIN + 2000))
    acc(trade(150, 1, MIN + 3000))
    acc(trade(999, 1, MIN * 2))

    const candle = onClose.mock.calls[0][0]
    expect(candle.high).toBe(200)
    expect(candle.low).toBe(50)
    expect(candle.close).toBe(150)
  })

  it('accumulates volume across trades', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1.5, MIN))
    acc(trade(100, 2.5, MIN + 1000))
    acc(trade(100, 1, MIN * 2))

    const candle = onClose.mock.calls[0][0]
    expect(candle.volume).toBeCloseTo(4)
  })

  it('emits multiple candles for multiple minutes', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1, MIN))
    acc(trade(200, 1, MIN * 2))
    acc(trade(300, 1, MIN * 3))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('sets candle time to the start of the minute as ISO string', () => {
    const onClose = vi.fn()
    const acc = createCandleAccumulator(onClose)

    acc(trade(100, 1, MIN + 30_000))
    acc(trade(200, 1, MIN * 2))

    const candle = onClose.mock.calls[0][0]
    expect(candle.time).toBe(new Date(MIN).toISOString())
  })
})
