'use client'

interface FormDotsProps { form: string; size?: number }

const COLORS: Record<string, string> = {
  W: '#00E676', D: '#FFD700', L: '#FF1744',
}
const LABELS: Record<string, string> = { W: 'Win', D: 'Draw', L: 'Loss' }

export default function FormDots({ form, size = 10 }: FormDotsProps) {
  const letters = form.split('').slice(-5)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {letters.map((r, i) => (
        <div
          key={i}
          title={LABELS[r] || r}
          style={{
            width: size, height: size,
            borderRadius: '50%',
            background: COLORS[r] || '#444',
            boxShadow: `0 0 6px ${COLORS[r] || '#444'}88`,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}
