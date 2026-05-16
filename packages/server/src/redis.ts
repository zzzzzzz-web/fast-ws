import { createClient } from 'redis'
import type { Trade } from './types.js'

type RedisClient = ReturnType<typeof createClient>

const TRADE_KEY = 'btc:trades'
const MAX_TRADES = 500

export async function connectRedis(): Promise<RedisClient> {
  const client = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
  await client.connect()
  return client
}

export async function storeTrade(client: RedisClient, trade: Trade): Promise<void> {
  await client.lPush(TRADE_KEY, JSON.stringify(trade))
  await client.lTrim(TRADE_KEY, 0, MAX_TRADES - 1)
}

export async function getRecentTrades(client: RedisClient): Promise<Trade[]> {
  const items = await client.lRange(TRADE_KEY, 0, -1)
  return items.map((item) => JSON.parse(item) as Trade)
}
