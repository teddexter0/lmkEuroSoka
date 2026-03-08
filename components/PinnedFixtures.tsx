'use client'
import type { PinnedFixture } from '@/types'

export default function PinnedFixtures({ fixtures }: { fixtures: PinnedFixture[] }) {
  if (!fixtures.length) return null
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', letterSpacing: '0.12em', marginBottom: 4 }}>
        ▶ MOUTH-WATERING FIXTURES THIS WEEK
      </p>
      {fixtures.map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 12px', borderRadius: 8,
          background: '#0a0a14', border: `1px solid ${f.color}33`,
        }}>
          <div style={{ width: 3, height: 32, borderRadius: 2, background: f.color, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#e0e0ee' }}>{f.label}</p>
            <p style={{ fontSize: 11, color: '#778899', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{f.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
