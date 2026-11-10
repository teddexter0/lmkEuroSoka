'use client'

import { useEffect, useState } from 'react'
import type { Fixture } from '@/types'
import FixtureCard from './FixtureCard'

const DAY = 86_400_000
const dayKey = (time: number) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(time))
const dateFormat = new Intl.DateTimeFormat('en-KE', {
  timeZone: 'Africa/Nairobi', weekday: 'long', day: 'numeric', month: 'long',
})
type View = 'Upcoming' | 'Results' | 'Live'

export default function MatchCentre({ league, fixtures, selected, incomplete = false }: {
  league: string; fixtures: Fixture[]; selected: string[]; incomplete?: boolean
}) {
  const [view, setView] = useState<View>('Upcoming')
  const [followed, setFollowed] = useState(false)
  const [club, setClub] = useState('')
  const [week, setWeek] = useState('')
  const [result, setResult] = useState<{ week: string; fixtures: Fixture[]; incomplete: boolean } | null>(null)
  const [failure, setFailure] = useState<{ week: string; message: string } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const now = Date.now()
  const activeWeek = result?.week === week ? result : null
  const weekError = failure?.week === week ? failure.message : ''
  const activeFixtures = week ? activeWeek?.fixtures ?? [] : fixtures

  useEffect(() => {
    if (!week) return
    const controller = new AbortController()
    fetch(`/api/matches?${new URLSearchParams({ league, start: week })}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'This week could not load.')
        if (!controller.signal.aborted) setResult({ week, incomplete: payload.incomplete,
          fixtures: (payload.fixtures as Fixture[]).map(match => ({ ...match, matchDate: new Date(match.matchDate) })) })
      }).catch(error => { if (!controller.signal.aborted) setFailure({ week, message: error.message }) })
    return () => controller.abort()
  }, [league, week, attempt])

  function chooseWeek(date: string) {
    if (date && (date < dayKey(Date.now() - 365 * DAY) || date > dayKey(Date.now() + 365 * DAY))) return
    setWeek(date); setClub(''); setFailure(null)
    if (date) setView(Date.parse(`${date}T00:00:00+03:00`) + 7 * DAY <= Date.now() ? 'Results' : 'Upcoming')
  }

  function moveWeek(direction: number) {
    const anchor = week ? Date.parse(`${week}T12:00:00+03:00`) : Date.now()
    chooseWeek(dayKey(anchor + direction * 7 * DAY))
  }
  const clubs = new Map<string, string>()
  for (const match of fixtures) {
    clubs.set(match.homeTeamId, match.homeName)
    clubs.set(match.awayTeamId, match.awayName)
  }

  const scoped = activeFixtures.filter(match => {
    const ids = [match.homeTeamId, match.awayTeamId]
    return (!followed || ids.some(id => selected.includes(id))) && (!club || ids.includes(club))
  })
  const matches = {
    Upcoming: scoped.filter(match => match.status === 'scheduled' && +match.matchDate >= now),
    Results: scoped.filter(match => match.status === 'final').sort((a, b) => +b.matchDate - +a.matchDate),
    Live: scoped.filter(match => match.status === 'live'),
  }
  const days = new Map<string, Fixture[]>()
  for (const match of matches[view]) {
    const date = dateFormat.format(match.matchDate)
    days.set(date, [...(days.get(date) ?? []), match])
  }

  return <section className="desk-section" aria-label="Match centre">
    <div className="desk-heading"><div><p className="desk-kicker">MATCH CENTRE</p><h2>Fixtures and results</h2></div>
      <span className="desk-muted">Kick-offs in EAT</span></div>
    <div className="desk-segments" aria-label="Match status">
      {(Object.keys(matches) as View[]).map(option => <button key={option} aria-pressed={view === option}
        onClick={() => setView(option)}>{option} <small>{matches[option].length}</small></button>)}
    </div>
    <div className="desk-controls">
      <label>Club<select value={club} onChange={event => setClub(event.target.value)}>
        <option value="">All clubs</option>
        {[...clubs].sort(([,a],[,b]) => a.localeCompare(b)).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      <button aria-pressed={followed} onClick={() => setFollowed(value => !value)}>Your clubs only</button>
      {(followed || club) && <button onClick={() => { setClub(''); setFollowed(false) }}>Reset filters</button>}
    </div>
    <div className="desk-controls">
      <button onClick={() => moveWeek(-1)}>Previous 7 days</button>
      <label>Browse by start date<input type="date" value={week} min={dayKey(now - 365 * DAY)} max={dayKey(now + 365 * DAY)}
        onChange={event => chooseWeek(event.target.value)} /></label>
      <button onClick={() => moveWeek(1)}>Next 7 days</button>
      {week && <button onClick={() => { chooseWeek(''); setView('Upcoming') }}>Back to latest</button>}
    </div>
    {weekError && <p className="desk-status" role="status">{weekError} <button onClick={() => {
      setFailure(null); setAttempt(value => value + 1)
    }}>Retry</button></p>}
    {week && !activeWeek && !weekError && <p className="desk-status" role="status">Loading match dates…</p>}
    {(week ? activeWeek?.incomplete : incomplete) && <p className="desk-muted">Some dates could not be loaded from the schedule feed.</p>}
    {!days.size && (!week || activeWeek) && <p className="desk-status">{view === 'Live' && !followed && !club ? 'No matches are live right now.' :
      followed || club ? 'No matches match these filters in the available schedule.' : `No ${view === 'Results' ? 'recent results' : 'upcoming fixtures'} in the available schedule.`}</p>}
    {[...days].map(([date, games]) => <div className="desk-match-day" key={date}>
      <h3>{date}</h3>
      <div className="desk-stack">
        {games.map(match => <FixtureCard key={match.id} fixture={match} followed={selected.includes(match.homeTeamId) || selected.includes(match.awayTeamId)} />)}
      </div>
    </div>)}
  </section>
}
