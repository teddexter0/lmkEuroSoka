'use client'
import { useState, useEffect } from 'react'
import type { Team, Fixture, Story, PlayerStat, WeeklyDigest } from '@/types'
import { LEAGUE_THEMES, currentWeekLabel } from '@/lib/utils'

import LeagueNav       from './LeagueNav'
import FixtureList     from './FixtureList'
import StoryCard       from './StoryCard'
import StandingsTable  from './StandingsTable'
import PlayerStatsPanel from './PlayerStatsPanel'
import PinnedFixtures  from './PinnedFixtures'
import HistoryTicker   from './HistoryTicker'
import WildcardCard    from './WildcardCard'
import TeamSelector    from './TeamSelector'
import HumorSection    from './HumorSection'
import GolazoPanel     from './GolazoPanel'
import UCLBracket      from './UCLBracket'

type Tab = 'FIXTURES' | 'STORIES' | 'STATS' | 'TABLE' | 'UCL' | 'HUMOR'
const TABS: Tab[] = ['FIXTURES', 'STORIES', 'STATS', 'TABLE', 'UCL', 'HUMOR']

export default function Dashboard() {
  const [activeLeague, setActiveLeague]   = useState('EPL')
  const [activeTab, setActiveTab]         = useState<Tab>('FIXTURES')
  const [weekLabel, setWeekLabel]         = useState(currentWeekLabel())
  const [prevWeeks, setPrevWeeks]         = useState<string[]>([])
  const [showSelector, setShowSelector]   = useState(false)

  const [teams, setTeams]         = useState<Team[]>([])
  const [fixtures, setFixtures]   = useState<Fixture[]>([])
  const [stories, setStories]     = useState<Story[]>([])
  const [stats, setStats]         = useState<PlayerStat[]>([])
  const [digest, setDigest]       = useState<WeeklyDigest | null>(null)
  const [selected, setSelected]   = useState<string[]>([
    'MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY','ATM','RMA','PSG','BMU','BVB','LEV','INT','ACM','JUV','ASM'
  ])
  const [loading, setLoading]     = useState(true)

  const theme = LEAGUE_THEMES[activeLeague] || LEAGUE_THEMES.EPL

  // Load all data
  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?week=${encodeURIComponent(weekLabel)}`)
      .then(r => r.json())
      .then(data => {
        setTeams(data.teams ?? [])
        setFixtures((data.fixtures ?? []).map((f: any) => ({
          ...f,
          matchDate: f.matchDate ? new Date(f.matchDate) : new Date(),
        })))
        setStories(data.stories ?? [])
        setDigest(data.digest ?? null)
        setPrevWeeks(data.prevWeeks ?? [])
        setStats(data.stats ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [weekLabel])

  // Handle team selection changes
  async function handleSelectionChange(ids: string[]) {
    setSelected(ids)
    fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedTeams: ids }),
    }).catch(e => console.warn('Could not save preferences:', e))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f' }}>
      {/* ── TOP HEADER ───────────────────────────────────────────── */}
      <div className="league-header" style={{
        background: `linear-gradient(180deg, ${theme.primary}cc 0%, #07070f 100%)`,
        padding: '0 0 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              lmk<span style={{ color: theme.accent }}>Euro</span>Soka
            </h1>
            <p style={{ fontSize: 11, color: '#778899', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              {weekLabel.toUpperCase()} · EAT TIMEZONE
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Previous weeks */}
            {prevWeeks.length > 1 && (
              <select
                value={weekLabel}
                onChange={e => setWeekLabel(e.target.value)}
                style={{
                  background: '#0a0a14', border: '1px solid #1c1c2e', color: '#778899',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '6px 10px',
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                {prevWeeks.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            )}
            {/* Team selector */}
            <button
              onClick={() => setShowSelector(true)}
              style={{
                background: '#0a0a14', border: '1px solid #1c1c2e',
                color: '#778899', padding: '7px 10px', borderRadius: 6,
                cursor: 'pointer', fontSize: 16,
              }}
              title="Select your clubs"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* History ticker */}
        {digest?.historyFacts && <HistoryTicker facts={digest.historyFacts} />}

        {/* League nav */}
        <LeagueNav active={activeLeague} onChange={setActiveLeague} />

        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 0, borderBottom: '1px solid #1c1c2e', scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px', border: 'none', background: 'transparent',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em',
                color: activeTab === tab ? theme.accent : '#444466',
                borderBottom: `2px solid ${activeTab === tab ? theme.accent : 'transparent'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#444466' }}>Loading...</p>
        </div>
      ) : (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px' }}>

          {/* FIXTURES TAB */}
          {activeTab === 'FIXTURES' && (
            <div>
              {digest?.pinnedFixtures && <PinnedFixtures fixtures={digest.pinnedFixtures} />}
              <WildcardCard digest={digest} teams={teams} />
              <FixtureList fixtures={fixtures} activeLeague={activeLeague} selectedTeams={selected} />
            </div>
          )}

          {/* STORIES TAB */}
          {activeTab === 'STORIES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#444466' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                    Stories load from Firebase. Run npm run seed or wait for weekly cron.
                  </p>
                </div>
              ) : (
                stories
                  .filter(s => {
                    const t = teams.find(x => x.id === s.teamId)
                    return !t || t.league === activeLeague || s.teamId === 'UCL'
                  })
                  .map(s => <StoryCard key={s.id} story={s} teams={teams} />)
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'STATS' && (
            <PlayerStatsPanel
              stats={stats.filter(s => selected.includes(s.teamId))}
              teams={teams}
            />
          )}

          {/* TABLE TAB */}
          {activeTab === 'TABLE' && (
            <StandingsTable activeLeague={activeLeague} />
          )}

          {/* UCL TAB */}
          {activeTab === 'UCL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <UCLBracket />
              <GolazoPanel />
            </div>
          )}

          {/* HUMOR TAB */}
          {activeTab === 'HUMOR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <HumorSection items={digest?.humorItems || []} />
            </div>
          )}

        </div>
      )}

      {/* Team selector overlay */}
      {showSelector && (
        <TeamSelector
          teams={teams}
          selected={selected}
          onClose={() => setShowSelector(false)}
          onChange={handleSelectionChange}
        />
      )}

      {/* Bottom spacer for mobile */}
      <div style={{ height: 48 }} />
    </div>
  )
}
