'use client'

interface Props { items: string[] }

export default function HumorSection({ items }: Props) {
  if (!items.length) return null
  return (
    <div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', letterSpacing: '0.12em', marginBottom: 12 }}>
        😭 THIS WEEK IN FOOTBALL
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background: '#0a0a14', border: '1px solid #1c1c2e',
            borderRadius: 8, padding: '14px 16px',
            borderLeft: '3px solid #444466',
          }}>
            <p style={{ fontSize: 14, color: '#c0c0d8', lineHeight: 1.65 }}>{item}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#333355', marginTop: 14, fontStyle: 'italic', textAlign: 'center' }}>
        * No clubs were harmed in the making of this section.
      </p>
    </div>
  )
}
