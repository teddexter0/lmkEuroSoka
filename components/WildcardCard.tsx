'use client'
import type { Team, WeeklyDigest } from '@/types'

interface Props { digest: WeeklyDigest | null; teams: Team[] }

export default function WildcardCard({ digest, teams }: Props) {
  if (!digest?.wildcardTeamId) return null
  const team = teams.find(t => t.id === digest.wildcardTeamId)

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: 16, borderRadius: 10,
      background: 'linear-gradient(135deg, #0f0f1e, #1a0a0a)',
      border: '1px solid #CE112633',
    }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#CE1126', letterSpacing: '0.12em', marginBottom: 8 }}>
        🃏 WILDCARD PICK OF THE WEEK
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {team?.badgeUrl && (
          <img src={team.badgeUrl} alt={team.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
        )}
        <div>
          <p style={{ fontSize: 16, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e0e0ee' }}>
            {team?.name || digest.wildcardTeamId}
          </p>
          <p style={{ fontSize: 11, color: '#778899', fontFamily: 'JetBrains Mono, monospace' }}>{team?.league?.replace('_', ' ')}</p>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#aaaacc', lineHeight: 1.65 }}>{digest.wildcardReason}</p>
    </div>
  )
}
