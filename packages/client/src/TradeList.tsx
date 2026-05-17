import { format } from 'date-fns'

export interface Trade {
  price: number
  volume: number
  timestamp: number
  buyerMaker: boolean
}

interface TradeListProps {
  trades: Trade[]
}

export default function TradeList({ trades }: TradeListProps) {
  return (
    <div style={styles.list}>
      {trades.map((t, i) => (
        <div key={i} style={styles.row}>
          <span style={{ color: t.buyerMaker ? '#f87171' : '#4ade80' }}>
            {t.buyerMaker ? 'SELL' : 'BUY'}
          </span>
          <span style={styles.price}>
            ${t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span style={styles.vol}>{t.volume.toFixed(4)} BTC</span>
          <span style={styles.time}>{format(t.timestamp, 'HH:mm:ss')}</span>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  list: { display: 'flex', flexDirection: 'column', gap: '2px' },
  row: {
    display: 'grid',
    gridTemplateColumns: '4rem 1fr 1fr 1fr',
    gap: '1rem',
    padding: '0.2rem 0.5rem',
    background: '#1a1a1a',
    fontSize: '0.8rem',
  },
  price: { color: '#f0f0f0' },
  vol: { color: '#9ca3af' },
  time: { color: '#6b7280', textAlign: 'right' },
}
