import Fastify, { type FastifyInstance } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import WebSocket from 'ws'
import type { CandleRange } from './postgres.js'

export interface AppDeps {
  getCandles: (range: CandleRange) => Promise<unknown>
  getRecentTrades: () => Promise<unknown[]>
  getRecentPrices: () => Promise<unknown[]>
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false })
  await fastify.register(fastifyWebsocket)

  const clients = new Set<WebSocket>()
  const VALID_RANGES = new Set<CandleRange>(['day', 'week', 'month', 'year'])

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get<{ Querystring: { range?: string } }>(
    '/candles',
    async (req, reply) => {
      const range = (req.query.range ?? 'week') as CandleRange
      if (!VALID_RANGES.has(range)) {
        return reply.status(400).send({ error: 'invalid range' })
      }
      return deps.getCandles(range)
    },
  )

  fastify.get('/stream', { websocket: true }, (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))

    Promise.all([deps.getRecentTrades(), deps.getRecentPrices()])
      .then(([trades, prices]) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'backfill', trades, prices }))
        }
      })
      .catch(() => {})
  })

  return fastify
}
