'use client'
import FormDots from './FormDots'
import ClubBadge from './ClubBadge'
import { COMPETITIONS, isLeague } from '@/lib/competitions'
import type { StandingRow } from '@/types'

interface Props {
  activeLeague: string
  rows: StandingRow[]
  selectedTeams: string[]
}

function zoneClass(row: StandingRow, total: number): string {
  if (row.rank <= 4) return 'zone-ucl'
  if (row.rank <= 6) return 'zone-euro'
  if (row.rank > total - 3) return 'zone-rel'
  return ''
}

export default function StandingsTable({ activeLeague, rows, selectedTeams }: Props) {
  if (!rows.length) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#666688' }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        The standings feed has no table for this competition right now.
      </p>
    </div>
  )

  const expected = isLeague(activeLeague) ? COMPETITIONS[activeLeague].teams : 0
  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: 12, color: '#a5aec9', marginBottom: 10 }}>
        {rows.length} clubs{expected > rows.length ? ` · Feed is showing ${rows.length} of ${expected} expected clubs` : ''}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid #1c1c2e' }}>
          {['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts', 'Form'].map(heading => <th key={heading} style={{ padding: '8px 6px', textAlign: heading === 'Club' ? 'left' : 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666688', fontWeight: 500, letterSpacing: '0.08em' }}>{heading}</th>)}
        </tr></thead>
        <tbody>{rows.map(row => {
          const followed = selectedTeams.includes(row.teamId)
          return <tr key={`${row.rank}-${row.teamId}`} className={activeLeague === 'EPL' && rows.length === expected ? zoneClass(row, rows.length) : ''} style={{ borderBottom: '1px solid #0f0f1e', background: followed ? '#8899ff0d' : 'transparent' }}>
            <td style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{row.rank}</td>
            <td style={{ padding: '9px 6px' }}><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ClubBadge name={row.team} url={row.badgeUrl} fallback={row.fallbackBadgeUrl} size={20} /><span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: followed ? 700 : 400, color: followed ? '#e0e0ee' : '#aaaacc' }}>{row.team}</span></span></td>
            {[row.w + row.d + row.l, row.w, row.d, row.l, row.gd].map((value, index) => <td key={index} style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{value}</td>)}
            <td style={{ padding: '9px 6px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e0e0ee' }}>{row.pts}</td>
            <td style={{ padding: '9px 6px' }}><FormDots form={row.form || ''} /></td>
          </tr>
        })}</tbody>
      </table>
    </div>
  )
}
