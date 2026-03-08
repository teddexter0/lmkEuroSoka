'use client'
import type { Fixture } from '@/types'
import FixtureCard from './FixtureCard'

interface Props {
  fixtures: Fixture[]
  activeLeague: string
  selectedTeams: string[]
}

export default function FixtureList({ fixtures, activeLeague, selectedTeams }: Props) {
  const filtered = fixtures.filter(f => {
    if (activeLeague === 'UCL') return f.league === 'UCL'
    const leagueMatch = f.league === activeLeague
    const teamMatch = selectedTeams.includes(f.homeTeamId) || selectedTeams.includes(f.awayTeamId)
    return leagueMatch && teamMatch
  })

  // Sort: pinned first, then by tier weight, then by date
  const TIER_WEIGHT: Record<string, number> = { unmissable: 0, priority: 1, watch: 2 }
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const tw = (TIER_WEIGHT[a.tier] || 2) - (TIER_WEIGHT[b.tier] || 2)
    if (tw !== 0) return tw
    return a.matchDate.getTime() - b.matchDate.getTime()
  })

  if (!sorted.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: '#444466' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>No fixtures this week for selected teams.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map(f => <FixtureCard key={f.id} fixture={f} />)}
    </div>
  )
}
