'use client'

import { useState } from 'react'
import type { Fixture, StandingRow } from '@/types'
import GolazoPanel from './GolazoPanel'
import MatchCentre from './MatchCentre'
import StandingsTable from './StandingsTable'

export default function EuropeanCentre({ initialLeague, fixtures, standings, selected, incomplete }: {
  initialLeague: 'UCL' | 'UWCL'; fixtures: Fixture[]; standings: Record<string, StandingRow[]>; selected: string[]; incomplete: string[]
}) {
  const [league, setLeague] = useState(initialLeague)
  const [view, setView] = useState<'Matches' | 'Table' | 'Golazo'>('Matches')
  return <div className="desk-stack">
    <div className="desk-heading"><div><p className="desk-kicker">EUROPE</p><h2>Champions League centre</h2></div></div>
    <div className="desk-segments" aria-label="Champions League competition">
      <button aria-pressed={league === 'UCL'} onClick={() => setLeague('UCL')}>Men’s Champions League</button>
      <button aria-pressed={league === 'UWCL'} onClick={() => setLeague('UWCL')}>Women’s Champions League</button>
    </div>
    <div className="desk-segments" aria-label="European coverage">
      {(['Matches', 'Table', 'Golazo'] as const).map(option => <button key={option} aria-pressed={option === view} onClick={() => setView(option)}>{option}</button>)}
    </div>
    {view === 'Matches' && <MatchCentre key={league} league={league} fixtures={fixtures.filter(match => match.league === league)}
      selected={selected} incomplete={incomplete.includes(league)} />}
    {view === 'Table' && <StandingsTable key={league} activeLeague={league} rows={standings[league] ?? []} selectedTeams={selected} />}
    {view === 'Golazo' && <GolazoPanel />}
  </div>
}
