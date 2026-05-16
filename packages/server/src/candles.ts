import type { Trade, Candle } from './types.js'

type OnClose = (candle: Candle) => void

export function createCandleAccumulator(
  onClose: OnClose,
): (trade: Trade) => void {
  let candle: Candle | null = null
  let currentMinute: number | null = null

  return function accumulate(trade: Trade): void {
    const minute = Math.floor(trade.timestamp / 60_000) * 60_000

    if (currentMinute !== null && minute !== currentMinute) {
      if (candle) onClose(candle)
      candle = null
    }

    currentMinute = minute

    if (!candle) {
      candle = {
        time: new Date(minute).toISOString(),
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.volume,
      }
    } else {
      if (trade.price > candle.high) candle.high = trade.price
      if (trade.price < candle.low) candle.low = trade.price
      candle.close = trade.price
      candle.volume += trade.volume
    }
  }
}
