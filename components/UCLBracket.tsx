'use client'
import { useEffect, useState } from 'react'

type Leg = {
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  date: string
  status: string
  round: string
}

type Tie = {
  id: string
  home: string
  away: string
  leg1: Leg
  leg2: Leg | null
  round: string
  done: boolean
}

function scoreStr(leg: Leg) {
  if (leg.status === 'FT') return `${leg.homeScore ?? '?'}-${leg.awayScore ?? '?'}`
  return new Date(leg.date).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function UCLBracket() {
  const [ties, setTies] = useState<Tie[]>([])
  const [activeRound, setActiveRound] = useState('League phase')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/ucl', { signal: controller.signal })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Champions League feed unavailable')
        setTies(data.ties ?? [])
        setActiveRound(data.activeRound || 'League phase')
      })
      .catch(reason => {
        if (reason.name !== 'AbortError') setError(reason.message || 'Champions League feed unavailable')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#F5C842' }}>
          ⭐ Champions League
        </h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666688', textAlign: 'right' }}>{activeRound}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666688' }}>Loading current UCL matches...</p></div>
      ) : error ? (
        <div style={{ padding: 18, background: '#1a0a10', borderRadius: 8, border: '1px solid #ff6b6b44', color: '#ffb3b3', fontSize: 12 }}>{error}</div>
      ) : ties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, background: '#0a0a14', borderRadius: 8, border: '1px solid #1c1c2e' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#666688' }}>No Champions League matches are published in the current feed window.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {ties.map(tie => (
            <div key={tie.id} style={{ background: '#0a0a14', border: `1px solid ${tie.done ? '#44ff8828' : '#F5C84228'}`, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${tie.done ? '#44ff88' : '#F5C842'}` }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#e0e0ee' }}>
                {tie.home} <span style={{ color: '#555577', fontWeight: 400 }}>vs</span> {tie.away}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#F5C842' }}>{tie.round.toUpperCase()}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: tie.done ? '#e0e0ee' : '#aaaacc' }}>{scoreStr(tie.leg1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
