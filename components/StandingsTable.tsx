'use client'
import FormDots from './FormDots'
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
  if (activeLeague === 'UCL' || !rows.length) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#666688' }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        {activeLeague === 'UCL' ? 'Use the UCL tab for Champions League coverage.' : 'No live table is stored yet. The daily refresh will retry automatically.'}
      </p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid #1c1c2e' }}>
          {['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts', 'Form'].map(heading => <th key={heading} style={{ padding: '8px 6px', textAlign: heading === 'Club' ? 'left' : 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666688', fontWeight: 500, letterSpacing: '0.08em' }}>{heading}</th>)}
        </tr></thead>
        <tbody>{rows.map(row => {
          const followed = selectedTeams.includes(row.teamId)
          return <tr key={`${row.rank}-${row.teamId}`} className={zoneClass(row, rows.length)} style={{ borderBottom: '1px solid #0f0f1e', background: followed ? '#8899ff0d' : 'transparent' }}>
            <td style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{row.rank}</td>
            <td style={{ padding: '9px 6px' }}><span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: followed ? 700 : 400, color: followed ? '#e0e0ee' : '#aaaacc' }}>{row.team}</span></td>
            {[row.w + row.d + row.l, row.w, row.d, row.l, row.gd].map((value, index) => <td key={index} style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{value}</td>)}
            <td style={{ padding: '9px 6px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e0e0ee' }}>{row.pts}</td>
            <td style={{ padding: '9px 6px' }}><FormDots form={row.form || ''} /></td>
          </tr>
        })}</tbody>
      </table>
    </div>
  )
}
