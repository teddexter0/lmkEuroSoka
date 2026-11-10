'use client'
import { useEffect, useState } from 'react'
import type { Story, Team } from '@/types'
import StoryCard from './StoryCard'

function ClubStory({ team, league }: { team: Team; league: string }) {
  const [story, setStory] = useState<Story | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/stories?club=${encodeURIComponent(team.id)}&league=${encodeURIComponent(league)}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Story feed unavailable')
        return response.json()
      })
      .then(setStory)
      .catch(() => { if (!controller.signal.aborted) setUnavailable(true) })
    return () => controller.abort()
  }, [team.id, league])
  return story ? <StoryCard story={story} teams={[team]} defaultOpen /> :
    <p role="status" style={{ padding: 16, color: '#a5aec9' }}>{team.name} · {unavailable ? 'Club desk unavailable' : 'Checking club desk…'}</p>
}

export default function StoriesPanel({ teams, league }: { teams: Team[]; league: string }) {
  if (!teams.length) return <p style={{ padding: 20 }}>Choose clubs in this competition under Your Clubs to build your story desk.</p>
  return <div style={{ display: 'grid', gap: 12 }}>
    {teams.map(team => <ClubStory key={`${league}-${team.id}`} team={team} league={league} />)}
  </div>
}
