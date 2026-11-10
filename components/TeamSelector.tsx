'use client'
import { useState } from 'react'
import type { Team } from '@/types'
import { LEAGUE_THEMES } from '@/lib/utils'

import { LEAGUE_ORDER } from '@/lib/competitions'
import ClubBadge from './ClubBadge'

interface Props {
  teams: Team[]
  selected: string[]
  onClose: () => void
  onChange: (ids: string[]) => void
}

export default function TeamSelector({ teams, selected, onClose, onChange }: Props) {
  const [local, setLocal] = useState<string[]>(selected)
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  function toggle(id: string) {
    setLocal(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function save() {
    onChange(local)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(3,3,10,0.97)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, background: '#07070f',
        borderBottom: '1px solid #1c1c2e', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
      }}>
        <div>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#e0e0ee' }}>Your Clubs</p>
          <p style={{ fontSize: 12, color: '#778899', marginTop: 2 }}>
            {local.length} selected · tap to toggle
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 6, border: '1px solid #1c1c2e',
            background: 'transparent', color: '#778899', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={save} style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: '#8899FF', color: '#07070f', cursor: 'pointer',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13,
          }}>Done</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        <input aria-label="Find a club" type="search" placeholder="Find a club" value={search}
          onChange={event => setSearch(event.target.value)}
          style={{ padding: 10, width: '100%', maxWidth: 420, background: '#111128', border: '1px solid #353554', borderRadius: 6, marginBottom: 18 }} />
        {LEAGUE_ORDER.map(league => {
          const leagueTeams = teams.filter(t => t.league === league && (t.name.toLowerCase().includes(query) || t.shortName.toLowerCase().includes(query)))
            .sort((a, b) => a.name.localeCompare(b.name))
          if (!leagueTeams.length) return null
          const theme = LEAGUE_THEMES[league]
          return (
            <div key={league} style={{ marginBottom: 28 }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                color: theme.accent, letterSpacing: '0.12em', marginBottom: 12,
              }}>
                {theme.badge} {theme.name.toUpperCase()}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {leagueTeams.map(team => {
                  const isSelected = local.includes(team.id)
                  return (
                    <button
                      key={team.id}
                      onClick={() => toggle(team.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${isSelected ? team.colorPrimary : '#1c1c2e'}`,
                        background: isSelected ? `${team.colorPrimary}15` : '#0a0a14',
                        boxShadow: isSelected ? `0 0 10px ${team.colorPrimary}30` : 'none',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <ClubBadge name={team.name} url={team.badgeUrl} fallback={team.fallbackBadgeUrl} size={22} />
                      <span style={{
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: 12,
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? '#e0e0ee' : '#778899',
                      }}>
                        {team.shortName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
