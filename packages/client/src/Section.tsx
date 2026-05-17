import { useState, type ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function Section({
  title,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={styles.wrapper}>
      <button style={styles.header} onClick={() => setOpen((o) => !o)}>
        <span style={styles.title}>{title}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        >
          <polyline
            points="3,6 8,11 13,6"
            stroke="#6b7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { marginBottom: '1.5rem' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #1a1a1a',
    padding: '0.3rem 0',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    color: 'inherit',
  },
  title: {
    fontSize: '1rem',
    letterSpacing: '0.1em',
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
}
