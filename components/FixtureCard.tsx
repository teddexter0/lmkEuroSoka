'use client'
import { useState } from 'react'
import type { Fixture } from '@/types'
import WinProbBar from './WinProbBar'
import { daysUntil, toEAT, tierLabel, tierColor } from '@/lib/utils'

function hex2rgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function FixtureCard({ fixture }: { fixture: Fixture }) {
  const [expanded, setExpanded] = useState(false)
  const hp = fixture.homeColorPrimary || '#333'
  const ap = fixture.awayColorPrimary || '#333'

  const kitBg = `linear-gradient(90deg, ${hex2rgba(hp, 0.35)} 0%, ${hex2rgba(hp, 0)} 42%),
                 linear-gradient(270deg, ${hex2rgba(ap, 0.35)} 0%, ${hex2rgba(ap, 0)} 42%),
                 #0a0a14`

  const isResult = fixture.status === 'final'

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: kitBg, border: '1px solid #1c1c2e',
        borderRadius: 10, padding: '14px 16px',
        cursor: 'pointer', userSelect: 'none',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className={`tier-${fixture.tier}`} style={{ color: tierColor(fixture.tier) }}>
          {tierLabel(fixture.tier)}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466' }}>
          {fixture.competition}
        </span>
        {fixture.isDerby && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#FF4500' }}>⚡ DERBY</span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e0e0ee' }}>{fixture.homeName}</p>
        </div>

        <div style={{ textAlign: 'center', minWidth: 56 }}>
          {isResult ? (
            <p style={{ fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ffffff', letterSpacing: 2 }}>
              {fixture.homeScore} – {fixture.awayScore}
            </p>
          ) : (
            <div>
              <p style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#ffffff', fontWeight: 600 }}>vs</p>
              <p suppressHydrationWarning style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#FFD700', marginTop: 2 }}>
                {daysUntil(fixture.matchDate)}
              </p>
            </div>
          )}
        </div>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e0e0ee' }}>{fixture.awayName}</p>
        </div>
      </div>

      {/* Date + time */}
      <p suppressHydrationWarning style={{ textAlign: 'center', fontSize: 11, color: '#778899', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>
        {toEAT(fixture.matchDate)}
      </p>

      {/* Win prob bar */}
      {!isResult && (
        <div style={{ marginTop: 10 }}>
          <WinProbBar
            home={fixture.winProbHome} draw={fixture.winProbDraw} away={fixture.winProbAway}
            homeColor={hp} awayColor={ap}
            homeName={fixture.homeName} awayName={fixture.awayName}
          />
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: '1px solid #1c1c2e', paddingTop: 14 }}>
          {fixture.preview && (
            <div className="story-body" style={{ marginBottom: 14 }}>
              {fixture.preview.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
          {fixture.refereeName && (
            <div style={{ background: '#0d0d1f', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', marginBottom: 4 }}>🟨 REFEREE</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e0e0ee', marginBottom: 3 }}>{fixture.refereeName}</p>
              {fixture.refereeNote && <p style={{ fontSize: 12, color: '#778899' }}>{fixture.refereeNote}</p>}
            </div>
          )}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#444466', fontFamily: 'JetBrains Mono, monospace' }}>
            ▲ tap to collapse
          </p>
        </div>
      )}

      {!expanded && fixture.preview && (
        <p style={{ textAlign: 'center', fontSize: 10, color: '#444466', fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>
          ▼ preview + referee
        </p>
      )}
    </div>
  )
}
