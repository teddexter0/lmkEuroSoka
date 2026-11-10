'use client'

import { useEffect, useState } from 'react'
import type { PlayerMetric, SeasonPlayer } from '@/lib/player-stats'
import type { Team } from '@/types'
import ClubBadge from './ClubBadge'

type Metric = PlayerMetric | 'contributions'
const METRICS: Record<Metric, [short: string, label: string]> = {
  goals: ['G', 'Goals'], assists: ['A', 'Assists'], contributions: ['G+A', 'Goal contributions'],
  minutesPlayed: ['Min', 'Minutes played'], appearances: ['Apps', 'Appearances'], started: ['Starts', 'Starts'],
  yellowCards: ['YC', 'Yellow cards'], redCards: ['RC', 'Red cards'], fouls: ['Fouls', 'Fouls committed'],
  shots: ['Shots', 'Shots'], shotsOnTarget: ['On target', 'Shots on target'], keyPasses: ['Shot assists', 'Shot assists'],
  tackles: ['Tackles', 'Tackles'], interceptions: ['Int', 'Interceptions'], cleanSheets: ['CS', 'Clean sheets'], saves: ['Saves', 'Saves'],
}
const GROUPS: Record<string, Metric[]> = {
  Overview: ['goals', 'assists', 'contributions', 'minutesPlayed', 'appearances'],
  Attack: ['goals', 'assists', 'contributions', 'shots', 'shotsOnTarget', 'keyPasses'],
  Playing: ['minutesPlayed', 'appearances', 'started'],
  Discipline: ['yellowCards', 'redCards', 'fouls'],
  Defence: ['tackles', 'interceptions'],
  Goalkeeping: ['cleanSheets', 'saves'],
  All: Object.keys(METRICS) as Metric[],
}
const DETAILS = new Set<Metric>(['minutesPlayed', 'started', 'keyPasses', 'tackles', 'interceptions', 'cleanSheets'])
const POSITION_LABELS: Record<string, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }
const PAGE_SIZE = 25

type Payload = { players: SeasonPlayer[]; season: string; sourceUrl: string; failedClubIds?: string[] }

function value(player: SeasonPlayer, metric: Metric) {
  const { goals, assists } = player.metrics
  return metric === 'contributions' ? goals != null && assists != null ? goals + assists : undefined : player.metrics[metric]
}

function positionOf(raw: string) {
  const position = raw.toUpperCase()
  if (['G', 'GK'].includes(position)) return 'GK'
  if (position === 'D' || /^(DF|DEF|CB|LB|RB|WB)/.test(position)) return 'DEF'
  if (position === 'M' || /M[FID]?$/.test(position)) return 'MID'
  if (position === 'F' || /^(FW|ST|CF|LW|RW)/.test(position)) return 'FWD'
  return ''
}

async function requestStats(league: string, signal: AbortSignal, club?: string): Promise<Payload> {
  const query = new URLSearchParams({ league, ...(club ? { club } : {}) })
  const response = await fetch(`/api/player-stats?${query}`, { signal })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Player stats could not load.')
  return body
}

export default function PlayerStatsPanel({ league, teams, followed }: { league: string; teams: Team[]; followed: Team[] }) {
  const [data, setData] = useState<Payload | null>(null)
  const [detail, setDetail] = useState<Record<string, SeasonPlayer[] | null>>({})
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [scope, setScope] = useState(followed.some(team => team.espnId) ? 'followed' : 'league')
  const [group, setGroup] = useState('Overview')
  const [metric, setMetric] = useState<Metric>('goals')
  const [descending, setDescending] = useState(true)
  const [position, setPosition] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [compare, setCompare] = useState<string[]>([])
  const [manualDetails, setManualDetails] = useState(false)

  const clubs = teams.filter(team => team.espnId).sort((a, b) => a.name.localeCompare(b.name))
  const clubsById = new Map(clubs.map(team => [team.espnId, team]))
  const followedIds = new Set(followed.flatMap(team => team.espnId ? [team.espnId] : []))
  const ids = [...new Set((data?.players ?? []).map(player => player.clubId))]
    .filter(id => scope === 'league' || (scope === 'followed' ? followedIds.has(id) : scope === id))
  const detailScope = ids.sort().join(',')
  const wantsDetail = DETAILS.has(metric) || manualDetails

  useEffect(() => {
    const controller = new AbortController()
    requestStats(league, controller.signal).then(payload => {
      if (!controller.signal.aborted) setData(payload)
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason.message)
    })
    return () => controller.abort()
  }, [league, retry])

  useEffect(() => {
    if (!detailScope || !wantsDetail) return
    const controller = new AbortController()
    const queue = detailScope.split(',').filter(id => !(id in detail))
    async function loadNext() {
      while (queue.length && !controller.signal.aborted) {
        const id = queue.shift()!
        try {
          const payload = await requestStats(league, controller.signal, id)
          if (!controller.signal.aborted) setDetail(current => ({ ...current, [id]: payload.players }))
        } catch {
          if (!controller.signal.aborted) setDetail(current => ({ ...current, [id]: null }))
        }
      }
    }
    void Promise.all([loadNext(), loadNext(), loadNext()])
    return () => controller.abort()
    // The queue owns its in-flight requests. Completed clubs are reused when the scope changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, detailScope, wantsDetail, retry])

  const expanded = new Map<string, SeasonPlayer>()
  for (const club of Object.values(detail)) {
    for (const player of club ?? []) expanded.set(`${player.clubId}-${player.id}`, player)
  }
  const idSet = new Set(ids)
  const search = query.trim().toLocaleLowerCase()
  const players = (data?.players ?? []).map(player => expanded.get(`${player.clubId}-${player.id}`) ?? player)
    .filter(player => idSet.has(player.clubId) && (!position || positionOf(player.position) === position) &&
      `${player.name} ${player.club}`.toLocaleLowerCase().includes(search))
    .sort((a, b) => {
      const left = value(a, metric)
      const right = value(b, metric)
      if (left == null || right == null) return Number(left == null) - Number(right == null) || a.name.localeCompare(b.name)
      return (descending ? right - left : left - right) || a.name.localeCompare(b.name)
    })
  const pages = Math.max(1, Math.ceil(players.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const columns = GROUPS[group]
  const detailsPending = wantsDetail && ids.some(id => !(id in detail))
  const detailsMissing = wantsDetail && ids.some(id => detail[id] === null)
  const chosen = (data?.players ?? []).map(player => expanded.get(`${player.clubId}-${player.id}`) ?? player).filter(player => compare.includes(`${player.clubId}-${player.id}`))
  const start = currentPage * PAGE_SIZE
  const leadMetrics: Metric[] = ['goals', 'assists', 'minutesPlayed', 'yellowCards']
  const leaders = leadMetrics.map(key => ({
    key,
    player: players.reduce<SeasonPlayer | undefined>((leader, player) =>
      (value(player, key) ?? -1) > (leader ? value(leader, key) ?? -1 : -1) ? player : leader, undefined),
  }))

  function sortBy(next: Metric) {
    setMetric(next)
    setDescending(next === metric ? !descending : true)
    if (!columns.includes(next)) setGroup('All')
    setPage(0)
  }

  function reset() {
    setGroup('Overview'); setMetric('goals'); setDescending(true); setQuery(''); setPosition('')
    setScope(followedIds.size ? 'followed' : 'league'); setPage(0); setCompare([]); setManualDetails(false)
  }

  return <section className="desk-section" aria-label="Player stats">
    <div className="desk-heading"><div><p className="desk-kicker">STATS CENTRE</p><h2>Player leaders</h2></div>
      {data && <span className="desk-muted">{data.season} season</span>}</div>
    <div className="desk-segments" aria-label="Stat category">
      {Object.keys(GROUPS).map(key => <button key={key} aria-pressed={group === key} onClick={() => {
        setGroup(key); setPage(0)
        if (!GROUPS[key].includes(metric)) { setMetric(GROUPS[key][0]); setDescending(true) }
      }}>{key}</button>)}
    </div>
    <div className="desk-controls">
      <label>Clubs<select value={scope} onChange={event => { setScope(event.target.value); setPage(0); setCompare([]) }}>
        <option value="followed">Your clubs ({followedIds.size})</option><option value="league">All clubs</option>
        {clubs.map(club => <option key={club.id} value={club.espnId}>{club.name}</option>)}
      </select></label>
      <label>Position<select value={position} onChange={event => { setPosition(event.target.value); setPage(0) }}>
        <option value="">All positions</option>{Object.entries(POSITION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Sort by<select value={metric} onChange={event => sortBy(event.target.value as Metric)}>
        {Object.entries(METRICS).map(([key, [, label]]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Search<input type="search" placeholder="Player or club" value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} /></label>
      <button type="button" onClick={() => sortBy(metric)} aria-label={descending ? 'Sort ascending' : 'Sort descending'}>{descending ? 'High to low' : 'Low to high'}</button>
      <button type="button" onClick={reset}>Reset</button>
    </div>
    {error && <p className="desk-status" role="status">{error} <button onClick={() => { setError(''); setRetry(value => value + 1) }}>Retry</button></p>}
    {!data && !error && <p className="desk-status" role="status">Loading competition totals…</p>}
    {data && <>
      <div className="desk-meta">
        <span>{players.length} players · <a href={data.sourceUrl} target="_blank" rel="noreferrer">ESPN</a> · — unreported</span>
        {!wantsDetail && <button onClick={() => setManualDetails(true)}>Load minutes & detail</button>}
        {detailsPending && <span role="status">Loading detailed totals for {ids.filter(id => !(id in detail)).length} clubs…</span>}
        {(detailsMissing || !!data.failedClubIds?.length) && <button onClick={() => {
          setDetail(current => Object.fromEntries(Object.entries(current).filter(([, rows]) => rows !== null)))
          setRetry(value => value + 1)
        }}>Retry missing clubs</button>}
      </div>
      {players.length > 0 && <div className="desk-leaders" aria-label="Leaders in the current filters">
        {leaders.map(({ key, player }) => <button type="button" className="desk-card desk-leader" key={key} onClick={() => sortBy(key)}>
          <small>{METRICS[key][1]}</small><strong>{player?.name ?? (detailsPending ? 'Loading…' : 'View ranking')}</strong>
          {player && <span>{player.club} · {value(player, key)}</span>}
        </button>)}
      </div>}
      {chosen.length > 0 && <div aria-label="Player comparison" className="desk-stack">
        <div className="desk-meta"><strong>Player comparison</strong><span>{chosen.length === 1 ? 'Choose one more player to compare.' : 'Showing the current stat category.'}</span>
          <button onClick={() => setCompare([])}>Clear</button></div>
        <div className="desk-leaders">{chosen.map(player => <article className="desk-card" key={`${player.clubId}-${player.id}`}>
          <h3>{player.name}</h3><p className="desk-muted">{player.club}</p>
          <dl className="desk-comparison">{columns.map(key => <div key={key}><dt>{METRICS[key][1]}</dt><dd>{value(player, key) ?? '—'}</dd></div>)}</dl>
        </article>)}</div>
      </div>}
      {!players.length ? <p className="desk-status">{scope === 'followed' && !followedIds.size ? 'Follow a club in this competition or switch to All clubs.' : 'No players match these filters.'}</p> :
      <>
        <div className="desk-table-wrap" tabIndex={0} role="region" aria-label="Sortable player rankings">
          <table className="desk-table stats-table">
            <thead><tr><th scope="col">#</th><th scope="col">Player</th>
              {columns.map(key => <th scope="col" key={key} aria-sort={metric === key ? descending ? 'descending' : 'ascending' : undefined}>
                <button type="button" onClick={() => sortBy(key)} title={METRICS[key][1]}>{METRICS[key][0]}{metric === key ? descending ? ' ↓' : ' ↑' : ''}</button>
              </th>)}
              <th scope="col">Compare</th>
            </tr></thead>
            <tbody>{players.slice(start, start + PAGE_SIZE).map((player, index) => {
              const id = `${player.clubId}-${player.id}`
              const club = clubsById.get(player.clubId)
              return <tr key={id}><td>{start + index + 1}</td><th scope="row">
                <div className="desk-player"><ClubBadge name={player.club} url={club?.badgeUrl} size={22} />
                  <span>{player.name}<small>{player.club}{player.position && ` · ${player.position}`}</small></span></div>
                </th>
                {columns.map(key => <td key={key} className={key === metric ? 'desk-sort-value' : undefined}>{value(player, key) ?? '—'}</td>)}
                <td><button type="button" aria-label={`Compare ${player.name}`} aria-pressed={compare.includes(id)}
                  onClick={() => setCompare(current => current.includes(id) ? current.filter(item => item !== id) : [...current.slice(-1), id])}>{compare.includes(id) ? '✓' : '+'}</button></td>
              </tr>
            })}</tbody>
          </table>
        </div>
        <div className="desk-pagination"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>{start + 1}–{Math.min(start + PAGE_SIZE, players.length)} of {players.length}</span>
          <button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      </>}
    </>}
  </section>
}
