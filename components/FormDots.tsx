'use client'

interface FormDotsProps { form: string; size?: number }

const COLORS: Record<string, string> = {
  W: '#00E676', D: '#FFD700', L: '#FF1744',
}
const LABELS: Record<string, string> = { W: 'Win', D: 'Draw', L: 'Loss' }

export default function FormDots({ form, size = 10 }: FormDotsProps) {
  // API returns form string oldest-first; last 5 chars = last 5 matches (left=oldest, right=most recent)
  const letters = form.split('').slice(-5)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} title="oldest → newest">
      {letters.map((r, i) => (
        <div
          key={i}
          title={`${LABELS[r] || r}${i === letters.length - 1 ? ' (most recent)' : ''}`}
          style={{
            width: size, height: size,
            borderRadius: '50%',
            background: COLORS[r] || '#444',
            boxShadow: `0 0 6px ${COLORS[r] || '#444'}88`,
            flexShrink: 0,
            // Most recent result is slightly larger
            transform: i === letters.length - 1 ? 'scale(1.3)' : 'none',
          }}
        />
      ))}
    </div>
  )
}
