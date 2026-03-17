'use client'
import { useState, useEffect } from 'react'

type Leg = {
  home: string; away: string
  homeScore: number | null; awayScore: number | null
  date: string; status: string; round: string
}
type Tie = {
  home: string; away: string
  leg1: Leg; leg2: Leg | null
  round: string; done: boolean
}

const UCL_CALENDAR = [
  ['R16 Leg 1', 'Mar 10–11'],
  ['R16 Leg 2', 'Mar 17–18'],
  ['QF Draw',   'Mar 21'],
  ['QF Leg 1',  'Apr 7–8'],
  ['QF Leg 2',  'Apr 14–15'],
  ['SF Leg 1',  'Apr 28–29'],
  ['SF Leg 2',  'May 5–6'],
  ['FINAL',     'May 30 · Budapest'],
]

function scoreStr(leg: Leg) {
  if (leg.status === 'FT') return `${leg.homeScore ?? '?'}-${leg.awayScore ?? '?'}`
  if (leg.status === 'NS' || !leg.status) {
    return new Date(leg.date).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric' })
  }
  return `${leg.homeScore ?? '?'}-${leg.awayScore ?? '?'} LIVE`
}

export default function UCLBracket() {
  const [ties, setTies] = useState<Tie[]>([])
  const [activeRound, setActiveRound] = useState('Round of 16')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ucl')
      .then(r => r.json())
      .then(data => {
        if (data.ties?.length > 0) {
          setTies(data.ties)
          setActiveRound(data.activeRound || 'Round of 16')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#F5C842' }}>
          ⭐ UCL — {activeRound}
        </h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>
          Final: Budapest · May 30
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>Loading UCL fixtures...</p>
        </div>
      ) : ties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, background: '#0a0a14', borderRadius: 8, border: '1px solid #1c1c2e' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>
            UCL fixtures load after first cron run.
          </p>
          <a href="/admin" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F5C842', marginTop: 8, display: 'block' }}>
            Run cron now →
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {ties.map((tie, i) => (
            <div key={i} style={{
              background: '#0a0a14',
              border: `1px solid ${tie.done ? '#44ff8828' : '#F5C84228'}`,
              borderRadius: 8, padding: '12px 14px',
              borderLeft: `3px solid ${tie.done ? '#44ff88' : '#F5C842'}`,
            }}>
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#e0e0ee' }}>
                  {tie.home} <span style={{ color: '#444466', fontWeight: 400 }}>vs</span> {tie.away}
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#F5C842', marginTop: 2 }}>
                  {tie.round?.toUpperCase()} {tie.done ? '· COMPLETED' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  <span style={{ color: '#444466' }}>L1 </span>
                  <span style={{ color: tie.leg1.status === 'FT' ? '#e0e0ee' : '#778899' }}>
                    {scoreStr(tie.leg1)}
                  </span>
                </div>
                {tie.leg2 && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    <span style={{ color: '#444466' }}>L2 </span>
                    <span style={{ color: tie.leg2.status === 'FT' ? '#e0e0ee' : '#778899' }}>
                      {scoreStr(tie.leg2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, padding: '12px 14px', background: '#0a0a14', borderRadius: 8, border: '1px solid #F5C84228' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F5C842', marginBottom: 8 }}>📅 UCL CALENDAR</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {UCL_CALENDAR.map(([stage, date]) => (
            <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{stage}</span>
              <span style={{ color: '#aaaacc', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
