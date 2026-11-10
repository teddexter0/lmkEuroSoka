'use client'

import { useEffect, useState } from 'react'
import type { Story, Team } from '@/types'
import StoryCard from './StoryCard'

function ClubStory({ team, league, open }: { team: Team; league: string; open: boolean }) {
  const [story, setStory] = useState<Story | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/stories?club=${encodeURIComponent(team.id)}&league=${encodeURIComponent(league)}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Story feed unavailable')
        return response.json()
      })
      .then(result => { if (!controller.signal.aborted) setStory(result) })
      .catch(() => { if (!controller.signal.aborted) setUnavailable(true) })
    return () => controller.abort()
  }, [team.id, league, attempt])
  return story ? <StoryCard story={story} teams={[team]} defaultOpen={open} /> :
    <p role="status" className="desk-status">{team.name} · {unavailable ? <>Club desk unavailable. <button onClick={() => {
      setUnavailable(false); setAttempt(value => value + 1)
    }}>Retry</button></> : 'Checking club desk…'}</p>
}

export default function StoriesPanel({ teams, league }: { teams: Team[]; league: string }) {
  const [club, setClub] = useState('')
  const shown = teams.filter(team => !club || team.id === club)
  return <section className="desk-section" aria-label="Club news">
    <div className="desk-heading"><div><p className="desk-kicker">CLUB NEWS</p><h2>Your club desk</h2></div></div>
    <p className="desk-muted">What happened, what changed and what to watch next, with sources on each club.</p>
    {teams.length ? <>
      <div className="desk-controls"><label>Club<select value={club} onChange={event => setClub(event.target.value)}>
        <option value="">All followed clubs</option>
        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select></label></div>
      <div className="desk-stack">
        {shown.map((team, index) => <ClubStory key={`${league}-${club}-${team.id}`} team={team} league={league} open={index === 0} />)}
      </div>
    </> : <p className="desk-status">Follow clubs in this competition under Your Clubs to build your news desk.</p>}
  </section>
}
