import { useEffect, useRef, useState } from 'react'
import LiveChart, { type PricePoint } from './LiveChart'
import CandleChart, { type CandlePoint, type CandleRange } from './CandleChart'
import TradeList, { type Trade } from './TradeList'
import Section from './Section'

interface ServerMessage {
  type: 'backfill' | 'trade' | 'candle' | 'price'
  trades?: Trade[]
  prices?: PricePoint[]
  trade?: Trade
  price?: number
  timestamp?: number
}

const MAX_CHART_POINTS = 300
const MAX_TRADES = 500

export default function App() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting')
  const [candleRange, setCandleRange] = useState<CandleRange>('day')
  const [candles, setCandles] = useState<CandlePoint[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${location.host}/stream`)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      if (wsRef.current !== ws) return
      setStatus('connected')
    })
    ws.addEventListener('close', () => {
      if (wsRef.current !== ws) return
      setStatus('disconnected')
    })

    ws.addEventListener('message', (event: MessageEvent<string>) => {
      if (wsRef.current !== ws) return
      const msg = JSON.parse(event.data) as ServerMessage

      if (msg.type === 'backfill') {
        if (msg.trades) setTrades(msg.trades.slice(0, MAX_TRADES))
        if (msg.prices) setPriceHistory([...msg.prices].reverse())
      }

      if (msg.type === 'trade' && msg.trade) {
        setTrades((prev) => [msg.trade!, ...prev].slice(0, MAX_TRADES))
      }

      if (
        msg.type === 'price' &&
        msg.price !== undefined &&
        msg.timestamp !== undefined
      ) {
        setCurrentPrice(msg.price)
        setPriceHistory((prev) =>
          [...prev, { price: msg.price!, timestamp: msg.timestamp! }].slice(
            -MAX_CHART_POINTS,
          ),
        )
      }
    })

    return () => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', () => ws.close(), { once: true })
      } else {
        ws.close()
      }
    }
  }, [])

  useEffect(() => {
    fetch(`/candles?range=${candleRange}`)
      .then((r) => {
        if (!r.ok) throw new Error(`candles ${r.status}`)
        return r.json()
      })
      .then((data: CandlePoint[]) => setCandles(data))
      .catch(console.error)
  }, [candleRange])

  const displayPrice = currentPrice ?? trades[0]?.price

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>BTC / USD</h1>
        <span
          style={{
            ...styles.badge,
            background: status === 'connected' ? '#16a34a' : '#dc2626',
          }}
        >
          {status}
        </span>
      </header>

      {displayPrice !== undefined && (
        <div style={styles.price}>
          ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      )}

      <Section title="CANDLES">
        <CandleChart
          data={candles}
          range={candleRange}
          onRangeChange={setCandleRange}
        />
      </Section>

      <Section title="LIVE · 5 MIN">
        <LiveChart data={priceHistory} />
      </Section>

      <Section title="TRADES">
        <TradeList trades={trades} />
      </Section>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'monospace',
    background: '#0f0f0f',
    minHeight: '100vh',
    color: '#e0e0e0',
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  title: { fontSize: '1.5rem', margin: 0 },
  badge: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.6rem',
    borderRadius: 9999,
    color: '#fff',
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#f0f0f0',
  },
}
