'use client'
import { useState, useEffect } from 'react'
import type { Team, Fixture, Story, WeeklyDigest, StandingRow } from '@/types'
import { LEAGUE_THEMES } from '@/lib/utils'
import { curateFixtures, fixturePins, fixtureShortlist, footballHumor } from '@/lib/curation'
import StoriesPanel from './StoriesPanel'

import LeagueNav       from './LeagueNav'
import FixtureList     from './FixtureList'
import StoryCard       from './StoryCard'
import StandingsTable  from './StandingsTable'
import PlayerStatsPanel from './PlayerStatsPanel'
import PinnedFixtures  from './PinnedFixtures'
import HistoryTicker   from './HistoryTicker'
import TeamSelector    from './TeamSelector'
import HumorSection    from './HumorSection'
import GolazoPanel     from './GolazoPanel'
import UCLBracket      from './UCLBracket'

type Tab = 'FIXTURES' | 'STORIES' | 'STATS' | 'TABLE' | 'UCL' | 'HUMOR'
const TABS: Tab[] = ['FIXTURES', 'STORIES', 'STATS', 'TABLE', 'UCL', 'HUMOR']

export default function Dashboard({ initialWeekLabel }: { initialWeekLabel: string }) {
  const [activeLeague, setActiveLeague]   = useState('EPL')
  const [activeTab, setActiveTab]         = useState<Tab>('FIXTURES')
  const [weekLabel, setWeekLabel]         = useState(initialWeekLabel)
  const [prevWeeks, setPrevWeeks]         = useState<string[]>([])
  const [showSelector, setShowSelector]   = useState(false)

  const [teams, setTeams]         = useState<Team[]>([])
  const [fixtures, setFixtures]   = useState<Fixture[]>([])
  const [stories, setStories]     = useState<Story[]>([])
  const [digest, setDigest]       = useState<WeeklyDigest | null>(null)
  const DEFAULT_SELECTED = ['MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY','ATM','RMA','PSG','BMU','BVB','LEV','INT','ACM','JUV','ASM']
  const [selected, setSelected]   = useState<string[]>(DEFAULT_SELECTED)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [unavailableSchedules, setUnavailableSchedules] = useState<string[]>([])
  const [standings, setStandings] = useState<Record<string, StandingRow[]>>({})

  const theme = LEAGUE_THEMES[activeLeague] || LEAGUE_THEMES.EPL

  // Load all data
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch(`/api/dashboard?week=${encodeURIComponent(weekLabel)}`, { signal: controller.signal })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Dashboard refresh failed')
        setTeams(data.teams ?? [])
        setFixtures((data.fixtures ?? []).map((f: any) => ({
          ...f,
          matchDate: f.matchDate ? new Date(f.matchDate) : new Date(),
        })))
        setStories(data.stories ?? [])
        setDigest(data.digest ?? null)
        setPrevWeeks(data.prevWeeks ?? [])
        setStandings(data.standings ?? {})
        setUnavailableSchedules(data.unavailableSchedules ?? [])
        try {
          const saved = window.localStorage.getItem('lmkeurosoka:selected-teams')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed)) setSelected(parsed)
          } else if (data.selectedTeams?.length > 0) setSelected(data.selectedTeams)
        } catch {
          window.localStorage.removeItem('lmkeurosoka:selected-teams')
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message || 'Could not load football data')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [weekLabel, reloadToken])

  // Handle team selection changes
  function handleSelectionChange(ids: string[]) {
    setSelected(ids)
    window.localStorage.setItem('lmkeurosoka:selected-teams', JSON.stringify(ids))
  }

  const current = weekLabel === initialWeekLabel
  const competitionClubs = new Set([
    ...(standings[activeLeague] ?? []).map(row => row.teamId),
    ...fixtures.filter(fixture => fixture.league === activeLeague).flatMap(f => [f.homeTeamId, f.awayTeamId]),
  ])
  const followedClubs = teams.filter(team => selected.includes(team.id) &&
    (team.league === activeLeague || competitionClubs.has(team.id)))
  const curated = current ? curateFixtures(fixtures, standings, selected) : []
  const shortlist = fixtureShortlist(curated)

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
              aria-label="Select your clubs"
            >
              Your Clubs
            </button>
          </div>
        </div>

        {/* History ticker */}
        {digest?.historyFacts && <HistoryTicker facts={digest.historyFacts} dateKey={weekLabel} />}

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

          {error && (
            <div style={{ marginBottom: 16, padding: 14, border: '1px solid #ff6b6b55', borderRadius: 8, background: '#2a1018', color: '#ffb3b3' }}>
              <p style={{ fontSize: 13, marginBottom: 8 }}>{error}</p>
              <button onClick={() => setReloadToken(value => value + 1)} style={{ background: '#ff6b6b', color: '#12070a', border: 0, borderRadius: 5, padding: '7px 12px', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
            </div>
          )}

          {activeTab === 'FIXTURES' && (
            <div>
              {current && <>
                <h2 style={{ fontSize: 20, margin: '4px 0 2px' }}>Your next 7 days</h2>
                <p style={{ fontSize: 13, color: '#a5aec9', marginBottom: 8 }}>Across Europe · followed clubs, rivalries and matches with stakes · EAT</p>
                <PinnedFixtures fixtures={fixturePins(shortlist.men)} heading="Men’s picks" />
                <PinnedFixtures fixtures={fixturePins(shortlist.women)} heading="Women’s picks" />
                {!curated.length && <p style={{ padding: '12px 0', color: '#a5aec9' }}>No matches meet your watchlist criteria in the next seven days.</p>}
                {!!unavailableSchedules.length && <p style={{ color: '#b5bdd6', fontSize: 12, padding: '8px 0' }}>
                  Schedule coverage may be incomplete for {unavailableSchedules.map(league => LEAGUE_THEMES[league].name).join(', ')}.
                </p>}
              </>}
              <h2 style={{ fontSize: 16, margin: '20px 0 10px' }}>{theme.name} · {current ? 'Your watchlist' : 'Archived fixtures'}</h2>
              <FixtureList fixtures={current ? curated : fixtures} activeLeague={activeLeague} selectedTeams={selected} curated={current} />
            </div>
          )}

          {activeTab === 'STORIES' && (current
            ? <StoriesPanel teams={followedClubs} league={activeLeague} />
            : <div style={{ display: 'grid', gap: 12 }}>
                {stories.filter(story => story.league === activeLeague && selected.includes(story.teamId))
                  .map(story => <StoryCard key={story.id} story={story} teams={teams} />)}
                {!stories.some(story => story.league === activeLeague && selected.includes(story.teamId)) &&
                  <p style={{ padding: 20 }}>No archived stories for your clubs in this competition.</p>}
              </div>)}

          {activeTab === 'STATS' && (current
            ? <PlayerStatsPanel key={activeLeague} league={activeLeague} teams={followedClubs} />
            : <p style={{ padding: 20 }}>Season player totals are available in the current dashboard.</p>)}

          {/* TABLE TAB */}
          {activeTab === 'TABLE' && (
            <StandingsTable activeLeague={activeLeague} rows={standings[activeLeague] ?? []} selectedTeams={selected} />
          )}

          {/* UCL TAB */}
          {activeTab === 'UCL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <UCLBracket key={activeLeague === "UWCL" ? "UWCL" : "UCL"} league={activeLeague === "UWCL" ? "UWCL" : "UCL"} />
              <GolazoPanel />
            </div>
          )}

          {/* HUMOR TAB */}
          {activeTab === 'HUMOR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <HumorSection items={current ? footballHumor(fixtures, selected) : (digest?.humorItems ?? []).filter(item => !item.includes("several group chats needing moderation"))} />
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
