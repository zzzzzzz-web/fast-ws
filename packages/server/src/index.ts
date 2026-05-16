import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import WebSocket from 'ws'
import { createBinanceFeed } from './binance.js'
import { connectRedis, storeTrade, getRecentTrades } from './redis.js'
import { connectPostgres, storeCandle } from './postgres.js'
import { createCandleAccumulator } from './candles.js'
import type { Trade, Candle } from './types.js'

const fastify = Fastify({ logger: true })
await fastify.register(fastifyWebsocket)

const redis = await connectRedis()
const sql = connectPostgres()
const clients = new Set<WebSocket>()

function broadcast(msg: unknown): void {
  const str = JSON.stringify(msg)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(str)
  }
}

const accumulate = createCandleAccumulator((candle: Candle) => {
  storeCandle(sql, candle)
    .then(() => broadcast({ type: 'candle', candle }))
    .catch((err: unknown) => fastify.log.error(err, 'store candle failed'))
})

let lastBroadcast = 0

const binance = createBinanceFeed(fastify.log)
binance.on('tick', (trade: Trade) => {
  accumulate(trade)

  const now = Date.now()
  if (now - lastBroadcast < 100) return
  lastBroadcast = now

  storeTrade(redis, trade)
    .then(() => broadcast({ type: 'trade', trade }))
    .catch((err: unknown) => fastify.log.error(err, 'store trade failed'))
})

fastify.get('/stream', { websocket: true }, (socket) => {
  clients.add(socket)

  socket.on('close', () => clients.delete(socket))
  socket.on('error', (err: Error) => fastify.log.error(err, 'ws client error'))

  getRecentTrades(redis)
    .then((trades) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'backfill', trades }))
      }
    })
    .catch((err: unknown) => fastify.log.error(err, 'backfill failed'))
})

await fastify.listen({ port: 3000, host: '0.0.0.0' })
