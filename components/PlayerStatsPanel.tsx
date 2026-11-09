'use client'
import type { Fixture, PlayerStat, StandingRow, Team } from '@/types'
import FormDots from './FormDots'

interface Props {
  stats: PlayerStat[]
  teams: Team[]
  standings: StandingRow[]
  fixtures: Fixture[]
  selectedTeams: string[]
}

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

export default function PlayerStatsPanel({ stats, teams, standings, fixtures, selectedTeams }: Props) {
  const teamIds = [...new Set(stats.map(s => s.teamId))]

  if (!stats.length) {
    const followedRows = standings.filter(row => selectedTeams.length === 0 || selectedTeams.includes(row.teamId))
    if (!followedRows.length) {
      return (
        <div style={{ textAlign: 'center', padding: 48, color: '#666688' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>No current team form is available for the selected clubs.</p>
        </div>
      )
    }

    return (
      <div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666688', letterSpacing: '0.1em', marginBottom: 12 }}>
          TEAM FORM · FREE LIVE FEED
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {followedRows.map(row => {
            const team = teams.find(item => item.id === row.teamId)
            const teamFixtures = fixtures.filter(fixture => fixture.homeTeamId === row.teamId || fixture.awayTeamId === row.teamId)
            const latest = teamFixtures.find(fixture => fixture.status === 'live') || teamFixtures.find(fixture => fixture.status === 'scheduled') || teamFixtures.at(-1)
            const fixtureLabel = latest?.status === 'scheduled' ? 'Next' : latest?.status === 'live' ? 'Live' : 'Latest'
            return (
              <div key={row.teamId} style={{ background: '#0a0a14', border: `1px solid ${team?.colorPrimary || '#8899ff'}33`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  {team?.badgeUrl && <img src={team.badgeUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#e0e0ee' }}>{row.team}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#778899' }}>#{row.rank} · {row.pts} PTS</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, textAlign: 'center', marginBottom: 12 }}>
                  {[['P', row.w + row.d + row.l], ['W', row.w], ['D', row.d], ['L', row.l], ['GD', row.gd]].map(([label, value]) => (
                    <div key={label} style={{ background: '#0d0d1f', borderRadius: 5, padding: '7px 2px' }}>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#555577', fontSize: 9 }}>{label}</p>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#d0d0e0', fontSize: 12, fontWeight: 700 }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <FormDots form={row.form || ''} />
                  {latest && <span style={{ color: '#778899', fontSize: 10, textAlign: 'right' }}>{fixtureLabel}: {latest.homeName} vs {latest.awayName}</span>}
                </div>
              </div>
            )
          })}
        </div>
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
