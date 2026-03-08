'use client'
import type { PlayerStat, Team } from '@/types'

interface Props { stats: PlayerStat[]; teams: Team[] }

function StatRow({ label, players, valueKey, suffix = '' }: {
  label: string
  players: PlayerStat[]
  valueKey: keyof PlayerStat
  suffix?: string
}) {
  const top5 = [...players].sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number)).slice(0, 5)
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}
      </p>
      {top5.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #0f0f1e' }}>
          <span style={{ fontSize: 12, color: '#c0c0d8' }}>{p.playerName}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#e0e0ee', fontWeight: 600 }}>
            {p[valueKey] as number}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function PlayerStatsPanel({ stats, teams }: Props) {
  const teamIds = [...new Set(stats.map(s => s.teamId))]

  if (!stats.length) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#444466' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>Player data loads after first cron run or seed.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {teamIds.map(teamId => {
        const team = teams.find(t => t.id === teamId)
        const teamStats = stats.filter(s => s.teamId === teamId)
        const injured = teamStats.filter(s => s.isInjured)
        const scouting = teamStats.find(s => s.scoutingNote)
        const color = team?.colorPrimary || '#8899FF'

        return (
          <div key={teamId} style={{
            background: '#0a0a14', border: `1px solid ${color}28`,
            borderRadius: 10, padding: 16,
          }}>
            {/* Team header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {team?.badgeUrl && (
                <img src={team.badgeUrl} alt={team.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              )}
              <div>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#e0e0ee' }}>{team?.name || teamId}</p>
                <p style={{ fontSize: 11, color: '#778899', fontFamily: 'JetBrains Mono, monospace' }}>{team?.league?.replace('_', ' ')}</p>
              </div>
            </div>

            <StatRow label="⚽ TOP GOALSCORERS" players={teamStats} valueKey="goals" />
            <StatRow label="🅰️ TOP ASSISTERS"  players={teamStats} valueKey="assists" />
            <StatRow label="📐 xG LEADERS"      players={teamStats} valueKey="xg" />
            <StatRow label="🎯 CHANCES CREATED"  players={teamStats} valueKey="chancesCreated" />
            <StatRow label="🔒 BALL RETENTION"   players={teamStats} valueKey="ballRetentionPct" suffix="%" />

            {/* Injuries */}
            {injured.length > 0 && (
              <div style={{ marginTop: 14, background: '#1a0a0a', borderRadius: 6, padding: '10px 12px' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#FF1744', marginBottom: 6 }}>🚑 INJURY LIST</p>
                {injured.map((p, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#e0e0ee', fontWeight: 600 }}>{p.playerName}</span>
                    {p.injuryNote && <span style={{ fontSize: 11, color: '#778899', marginLeft: 6 }}>— {p.injuryNote}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Scouting pick */}
            {scouting && (
              <div style={{ marginTop: 10, background: '#0f100a', borderRadius: 6, padding: '10px 12px', border: '1px solid #FFD70028' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#FFD700', marginBottom: 6 }}>🌟 SCOUTING DESK</p>
                <span style={{ fontSize: 12, color: '#e0e0ee', fontWeight: 600 }}>{scouting.playerName} </span>
                <span style={{ fontSize: 11, color: '#aaaacc' }}>— {scouting.scoutingNote}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
