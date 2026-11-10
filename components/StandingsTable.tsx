'use client'

import { useState } from 'react'
import FormDots from './FormDots'
import ClubBadge from './ClubBadge'
import { COMPETITIONS, isLeague } from '@/lib/competitions'
import { LEAGUE_THEMES } from '@/lib/utils'
import type { StandingRow } from '@/types'

const COLUMNS = [
  ['rank', '#', 'Position'], ['team', 'Club', 'Club'], ['played', 'P', 'Played'],
  ['w', 'W', 'Won'], ['d', 'D', 'Drawn'], ['l', 'L', 'Lost'], ['gf', 'GF', 'Goals for'],
  ['ga', 'GA', 'Goals against'], ['gd', 'GD', 'Goal difference'], ['pts', 'Pts', 'Points'],
] as const
type Sort = typeof COLUMNS[number][0]

function metric(row: StandingRow, key: Sort) {
  if (key === 'played') return row.w + row.d + row.l
  if (key === 'gd') {
    const difference = Number(row.gd)
    return Number.isFinite(difference) ? difference : undefined
  }
  return row[key]
}

export default function StandingsTable({ activeLeague, rows, selectedTeams }: {
  activeLeague: string; rows: StandingRow[]; selectedTeams: string[]
}) {
  const [followed, setFollowed] = useState(false)
  const [sort, setSort] = useState<Sort>('rank')
  const [ascending, setAscending] = useState(true)
  const expected = isLeague(activeLeague) ? COMPETITIONS[activeLeague].teams : 0
  const cup = rows.length === expected && (activeLeague === 'UCL' || activeLeague === 'UWCL')
  const direct = activeLeague === 'UWCL' ? 4 : 8
  const playoff = activeLeague === 'UWCL' ? 12 : 24
  const shown = rows.filter(row => !followed || selectedTeams.includes(row.teamId)).sort((a, b) => {
    const left = metric(a, sort), right = metric(b, sort)
    if (left == null || right == null) return Number(left == null) - Number(right == null) || a.rank - b.rank
    const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
    return (ascending ? order : -order) || a.rank - b.rank
  })

  function sortBy(key: Sort) {
    setAscending(sort === key ? !ascending : key === 'rank' || key === 'team')
    setSort(key)
  }

  return <section className="desk-section" aria-label="Standings">
    <div className="desk-heading"><div><p className="desk-kicker">STANDINGS</p><h2>{LEAGUE_THEMES[activeLeague]?.name ?? activeLeague}</h2></div>
      <span className="desk-muted">{rows.length} clubs{expected > rows.length ? ` of ${expected} expected` : ''}</span></div>
    <div className="desk-segments" aria-label="Table scope">
      <button aria-pressed={!followed} onClick={() => setFollowed(false)}>Full table</button>
      <button aria-pressed={followed} onClick={() => setFollowed(true)}>Your clubs</button>
      <button onClick={() => { setSort('rank'); setAscending(true) }}>Reset sort</button>
    </div>
    {!shown.length ? <p className="desk-status">{rows.length ? 'None of your followed clubs appear in this table.' : 'The standings feed has no table for this competition right now.'}</p> :
      <div className="desk-table-wrap" role="region" tabIndex={0} aria-label="Sortable competition standings">
        <table className="desk-table standings-table">
          <thead><tr>{COLUMNS.map(([key, label, title]) => <th scope="col" key={key}
            aria-sort={sort === key ? ascending ? 'ascending' : 'descending' : undefined}>
            <button onClick={() => sortBy(key)} title={title}>{label}{sort === key ? ascending ? ' ↑' : ' ↓' : ''}</button>
          </th>)}<th scope="col" title="Results in the available match window, oldest to newest">Recent form</th></tr></thead>
          <tbody>{shown.map(row => {
            const isFollowed = selectedTeams.includes(row.teamId)
            const qualification = cup ? row.rank <= direct ? 'Direct qualification'
              : row.rank <= playoff ? 'Knockout play-off places' : 'Outside qualification places' : row.zone
            const zone = cup ? row.rank <= direct ? 'zone-ucl' : row.rank <= playoff ? 'zone-euro' : 'zone-rel'
              : /relegation/i.test(row.zone ?? '') ? 'zone-rel'
              : /champions league/i.test(row.zone ?? '') ? 'zone-ucl' : /europa|conference/i.test(row.zone ?? '') ? 'zone-euro' : ''
            return <tr key={row.teamId} className={zone} data-followed={isFollowed || undefined}>
              <td title={qualification}>{row.rank}</td>
              <th scope="row"><div className="desk-player"><ClubBadge name={row.team} url={row.badgeUrl} fallback={row.fallbackBadgeUrl} size={22} />
                <span>{row.team}{isFollowed && <small>Following</small>}</span></div></th>
              {COLUMNS.slice(2).map(([key]) => <td key={key} className={key === 'pts' ? 'desk-sort-value' : undefined}>
                {key === 'gd' ? row.gd : metric(row, key) ?? '—'}
              </td>)}
              <td>{row.form ? <FormDots form={row.form} /> : '—'}</td>
            </tr>
          })}</tbody>
        </table>
      </div>}
    {cup && <p className="desk-muted">League phase finish · 1–{direct} go straight to the {activeLeague === 'UWCL' ? 'quarter-finals' : 'round of 16'}.
      {' '}{direct + 1}–{playoff} enter the play-offs.</p>}
    <p className="desk-muted">Recent form uses results in the available match window. — means unreported.</p>
  </section>
}
