import { EventEmitter } from 'events'
import WebSocket from 'ws'
import type { FastifyBaseLogger } from 'fastify'
import type { Trade } from './types.js'

const BINANCE_WS = 'wss://stream.binance.us:9443/ws/btcusdt@aggTrade'

export function createBinanceFeed(log: FastifyBaseLogger): EventEmitter {
  const emitter = new EventEmitter()
  let ws: WebSocket

  function connect(): void {
    log.info('binance: connecting...')
    ws = new WebSocket(BINANCE_WS)

    ws.on('open', () => log.info('binance: connected'))

    ws.on('message', (data: WebSocket.RawData) => {
      const raw = JSON.parse(data.toString()) as { p: string; q: string; T: number; m: boolean }
      const trade: Trade = {
        price: parseFloat(raw.p),
        volume: parseFloat(raw.q),
        timestamp: raw.T,
        buyerMaker: raw.m,
      }
      emitter.emit('tick', trade)
    })

    ws.on('close', () => {
      log.warn('binance: disconnected, reconnecting in 3s')
      setTimeout(connect, 3000)
    })

    ws.on('error', (err: Error) => {
      log.error(err, 'binance: ws error')
      ws.close()
    })
  }

  connect()
  return emitter
}
