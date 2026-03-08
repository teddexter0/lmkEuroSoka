'use client'
import { LEAGUE_THEMES } from '@/lib/utils'

const LEAGUES = ['EPL', 'LA_LIGA', 'BUNDESLIGA', 'SERIE_A', 'LIGUE_1', 'UCL']

interface Props { active: string; onChange: (l: string) => void }

export default function LeagueNav({ active, onChange }: Props) {
  return (
    <div style={{
      display: 'flex', overflowX: 'auto', gap: 6, padding: '12px 16px',
      background: '#0a0a14', borderBottom: '1px solid #1c1c2e',
      scrollbarWidth: 'none',
    }}>
      {LEAGUES.map(l => {
        const theme = LEAGUE_THEMES[l]
        const isActive = l === active
        return (
          <button
            key={l}
            onClick={() => onChange(l)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${isActive ? theme.accent : '#1c1c2e'}`,
              background: isActive ? `${theme.primary}` : 'transparent',
              color: isActive ? theme.accent : '#778899',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 12px ${theme.accent}30` : 'none',
            }}
          >
            <span>{theme.badge}</span>
            <span>{theme.name}</span>
          </button>
        )
      })}
    </div>
  )
}
