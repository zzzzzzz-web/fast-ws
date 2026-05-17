import { createClient } from 'redis'
import type { Trade } from './types.js'

type RedisClient = ReturnType<typeof createClient>

const TRADE_KEY = 'btc:trades'
const PRICE_KEY = 'btc:prices'
const MAX_TRADES = 500
const MAX_PRICES = 300

export async function connectRedis(): Promise<RedisClient> {
  const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  })
  await client.connect()
  return client
}

export async function storeTrade(
  client: RedisClient,
  trade: Trade,
): Promise<void> {
  await client.lPush(TRADE_KEY, JSON.stringify(trade))
  await client.lTrim(TRADE_KEY, 0, MAX_TRADES - 1)
}

export async function getRecentTrades(client: RedisClient): Promise<Trade[]> {
  const items = await client.lRange(TRADE_KEY, 0, -1)
  return items.map((item) => JSON.parse(item) as Trade)
}

export interface PricePoint {
  price: number
  timestamp: number
}

export async function storePrice(
  client: RedisClient,
  price: number,
  timestamp: number,
): Promise<void> {
  await client.lPush(PRICE_KEY, JSON.stringify({ price, timestamp }))
  await client.lTrim(PRICE_KEY, 0, MAX_PRICES - 1)
}

export async function getRecentPrices(
  client: RedisClient,
): Promise<PricePoint[]> {
  const items = await client.lRange(PRICE_KEY, 0, -1)
  return items.map((item) => JSON.parse(item) as PricePoint)
}
