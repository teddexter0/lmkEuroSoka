'use client'
import { useEffect, useState } from 'react'
import { clubNameKey } from '@/lib/club-names'
import type { PlayerMetric, SeasonPlayer } from '@/lib/player-stats'
import type { Team } from '@/types'
import ClubBadge from './ClubBadge'

const COLUMNS: Array<[PlayerMetric | 'contributions', string]> = [
  ['goals', 'G'], ['assists', 'A'], ['contributions', 'G+A'], ['minutesPlayed', 'Min'],
  ['appearances', 'Apps'], ['started', 'Starts'], ['yellowCards', 'YC'], ['redCards', 'RC'],
  ['fouls', 'Fouls'], ['expectedGoals', 'xG'], ['keyPasses', 'Key passes'],
  ['tackles', 'Tackles'], ['interceptions', 'Int'], ['cleanSheets', 'CS'], ['saves', 'Saves'],
]
type Metric = typeof COLUMNS[number][0]

function valueFor(player: SeasonPlayer, metric: Metric) {
  const { goals, assists } = player.metrics
  return metric === 'contributions'
    ? (goals == null || assists == null ? undefined : goals + assists)
    : player.metrics[metric]
}

type StatsResponse = { players: SeasonPlayer[]; season: string; sourceUrl: string }
export default function PlayerStatsPanel({ league, teams }: { league: string; teams: Team[] }) {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<Metric>('minutesPlayed')
  const hasClubs = teams.length > 0

  useEffect(() => {
    if (!hasClubs) return
    const controller = new AbortController()
    fetch(`/api/player-stats?league=${encodeURIComponent(league)}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error)
        setData(payload)
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [league, hasClubs])

  if (!hasClubs) return <p style={{ padding: 20 }}>Choose clubs in this competition under Your Clubs to see their players.</p>
  if (error || !data) return <p role="status" style={{ padding: 20 }}>{error || 'Loading season player stats…'}</p>

  return <div>
    <p style={{ color: '#a5aec9', fontSize: 12, marginBottom: 14 }}>{data.season} · Competition totals · <a href={data.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#aab6ff' }}>Sofascore</a> · — means unreported</p>
    {teams.map(team => {
      const keys = [clubNameKey(team.name), clubNameKey(team.shortName)]
      const players = data.players.filter(player => keys.includes(clubNameKey(player.club)))
        .sort((a, b) => (valueFor(b, sort) ?? -1) - (valueFor(a, sort) ?? -1) || a.name.localeCompare(b.name))
      return <section key={team.id} style={{ marginBottom: 20, padding: 12, border: '1px solid #252542', borderRadius: 10 }}>
        <h2 style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <ClubBadge name={team.name} url={team.badgeUrl} fallback={team.fallbackBadgeUrl} /> {team.name}
        </h2>
        {!players.length ? <p style={{ color: '#a5aec9' }}>No player totals are available for this club in this competition.</p> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
              <thead><tr><th scope="col" style={{ textAlign: 'left' }}>Player</th>
                {COLUMNS.map(([metric, label]) => <th scope="col" key={metric} aria-sort={sort === metric ? 'descending' : 'none'}>
                  <button type="button" onClick={() => setSort(metric)} style={{ padding: '5px 8px', color: sort === metric ? '#aab6ff' : 'inherit' }}>{label}</button>
                </th>)}
              </tr></thead>
              <tbody>{players.map(player => <tr key={player.id} style={{ borderTop: '1px solid #252542' }}>
                <th scope="row" style={{ textAlign: 'left', padding: '7px 8px 7px 0', fontWeight: 500 }}>{player.name} <small>{player.position}</small></th>
                {COLUMNS.map(([metric]) => <td key={metric} style={{ textAlign: 'center', padding: '7px 8px' }}>{valueFor(player, metric) ?? '—'}</td>)}
              </tr>)}</tbody>
            </table>
          </div>}
      </section>
    })}
  </div>
}
