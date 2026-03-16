'use client'
import { useState, useEffect } from 'react'
import FormDots from './FormDots'
import type { StandingRow } from '@/types'

// Static fallback data shown while Firebase populates (cron hasn't run yet)
const STATIC_FALLBACK: Record<string, StandingRow[]> = {
  EPL: [
    { rank:1,  team:'Arsenal',          teamId:'ARS', pts:67, w:20, d:7, l:3,  gd:'+31', form:'WWWDW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:2,  team:'Man City',         teamId:'MCI', pts:60, w:18, d:6, l:5,  gd:'+24', form:'WWLWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:3,  team:'Man United',       teamId:'MUN', pts:51, w:14, d:9, l:6,  gd:'+12', form:'WWWWL', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:4,  team:'Aston Villa',      teamId:'AVL', pts:51, w:14, d:9, l:6,  gd:'+10', form:'WDWLW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:true  },
    { rank:5,  team:'Chelsea',          teamId:'CFC', pts:48, w:13, d:9, l:7,  gd:'+8',  form:'WDWWW', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:false },
    { rank:6,  team:'Liverpool',        teamId:'LFC', pts:48, w:13, d:9, l:7,  gd:'+11', form:'WDLWL', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:false },
    { rank:7,  team:'Brighton',         teamId:'BRI', pts:43, w:11, d:10,l:8,  gd:'+4',  form:'WLWDW', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:true  },
    { rank:8,  team:'Bournemouth',      teamId:'BOU', pts:43, w:12, d:7, l:10, gd:'+3',  form:'LWWWL', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:true  },
    { rank:9,  team:'Everton',          teamId:'EVE', pts:40, w:10, d:10,l:9,  gd:'-2',  form:'DLDWW', isUserClub:false, isTopFour:false, isRelegation:false, isWatch:false },
    { rank:10, team:'Fulham',           teamId:'FUL', pts:40, w:10, d:10,l:9,  gd:'-1',  form:'LLLWD', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:true  },
    { rank:11, team:'Crystal Palace',   teamId:'CRY', pts:37, w:10, d:7, l:12, gd:'-5',  form:'WLWWL', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:true  },
    { rank:12, team:'Newcastle',        teamId:'NEW', pts:39, w:10, d:9, l:10, gd:'+2',  form:'WDWWW', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:false },
    { rank:16, team:'Spurs',            teamId:'TOT', pts:29, w:6,  d:11,l:12, gd:'-14', form:'LLLLL', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:true  },
    { rank:18, team:'Wolves',           teamId:'WOL', pts:22, w:5,  d:7, l:17, gd:'-22', form:'LWLLD', isUserClub:false, isTopFour:false, isRelegation:true,  isWatch:false },
    { rank:19, team:'Ipswich',          teamId:'IPS', pts:19, w:4,  d:7, l:18, gd:'-28', form:'LLLLD', isUserClub:false, isTopFour:false, isRelegation:true,  isWatch:false },
    { rank:20, team:'Southampton',      teamId:'SOT', pts:12, w:2,  d:6, l:21, gd:'-38', form:'DLLLL', isUserClub:false, isTopFour:false, isRelegation:true,  isWatch:false },
  ],
  LA_LIGA: [
    { rank:1, team:'Barcelona',   teamId:'BAR', pts:65, w:21, d:2, l:4, gd:'+38', form:'WWWWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:2, team:'Real Madrid', teamId:'RMA', pts:63, w:19, d:6, l:2, gd:'+35', form:'WLWWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:3, team:'Atlético',    teamId:'ATM', pts:54, w:16, d:6, l:5, gd:'+22', form:'WWWDW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:4, team:'Athletic',    teamId:'ATH', pts:51, w:15, d:6, l:6, gd:'+14', form:'WDWWL', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:5, team:'Villarreal',  teamId:'VIL', pts:44, w:12, d:8, l:7, gd:'+8',  form:'WDWDW', isUserClub:false, isTopFour:false, isRelegation:false, isWatch:false },
    { rank:6, team:'Betis',       teamId:'RBB', pts:42, w:12, d:6, l:9, gd:'+4',  form:'LWWWW', isUserClub:false, isTopFour:false, isRelegation:false, isWatch:false },
  ],
  BUNDESLIGA: [
    { rank:1, team:'Bayern Munich',  teamId:'BMU', pts:62, w:19, d:5, l:3,  gd:'+41', form:'WWWWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:2, team:'Leverkusen',     teamId:'LEV', pts:54, w:16, d:6, l:5,  gd:'+28', form:'WWDWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:3, team:'Dortmund',       teamId:'BVB', pts:48, w:14, d:6, l:7,  gd:'+12', form:'WLWWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:4, team:'Leipzig',        teamId:'RBL', pts:44, w:12, d:8, l:7,  gd:'+8',  form:'DWWDW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:5, team:'Frankfurt',      teamId:'SGE', pts:40, w:11, d:7, l:9,  gd:'+4',  form:'WDLWL', isUserClub:false, isTopFour:false, isRelegation:false, isWatch:false },
  ],
  SERIE_A: [
    { rank:1, team:'Napoli',         teamId:'NAP', pts:58, w:17, d:7, l:4,  gd:'+22', form:'WWWDW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:2, team:'Inter',          teamId:'INT', pts:54, w:16, d:6, l:5,  gd:'+30', form:'WWWDW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:3, team:'Atalanta',       teamId:'ATA', pts:50, w:14, d:8, l:5,  gd:'+18', form:'WDWWW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:4, team:'Juventus',       teamId:'JUV', pts:49, w:14, d:7, l:6,  gd:'+15', form:'WWLWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:5, team:'AC Milan',       teamId:'ACM', pts:44, w:12, d:8, l:7,  gd:'+8',  form:'WWWWW', isUserClub:true,  isTopFour:false, isRelegation:false, isWatch:false },
  ],
  LIGUE_1: [
    { rank:1, team:'Marseille',      teamId:'OLM', pts:60, w:18, d:6, l:4,  gd:'+26', form:'WWWWW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:2, team:'PSG',            teamId:'PSG', pts:57, w:17, d:6, l:5,  gd:'+32', form:'WWWWL', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:3, team:'Monaco',         teamId:'ASM', pts:55, w:16, d:7, l:5,  gd:'+24', form:'WWWWW', isUserClub:true,  isTopFour:true,  isRelegation:false, isWatch:false },
    { rank:4, team:'Lille',          teamId:'LIL', pts:48, w:14, d:6, l:8,  gd:'+12', form:'LWWDW', isUserClub:false, isTopFour:true,  isRelegation:false, isWatch:false },
  ],
  UCL: [],
}

function zoneClass(row: StandingRow): string {
  if (row.isTopFour) return 'zone-ucl'
  if (row.rank === 5 || row.rank === 6) return 'zone-euro'
  if (row.isRelegation) return 'zone-rel'
  if (row.isUserClub) return 'zone-user'
  return ''
}

export default function StandingsTable({ activeLeague }: { activeLeague: string }) {
  const [rows, setRows] = useState<StandingRow[]>(STATIC_FALLBACK[activeLeague] ?? [])
  const [stale, setStale] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/standings?league=${activeLeague}`)
      .then(r => r.json())
      .then(data => {
        if (data.rows?.length > 0) {
          setRows(data.rows)
          setStale(data.stale ?? false)
        } else {
          // Firebase has no data yet — use static fallback
          setRows(STATIC_FALLBACK[activeLeague] ?? [])
          setStale(true)
        }
      })
      .catch(() => {
        setRows(STATIC_FALLBACK[activeLeague] ?? [])
        setStale(true)
      })
      .finally(() => setLoading(false))
  }, [activeLeague])

  if (activeLeague === 'UCL') {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#444466' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          UCL standings not available — check the UCL tab for bracket view.
        </p>
      </div>
    )
  }

  return (
    <div>
      {stale && !loading && (
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444455', marginBottom: 8, textAlign: 'right' }}>
          · cached data — live updates after cron runs
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1c1c2e' }}>
              {['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts', 'Form'].map(h => (
                <th key={h} style={{
                  padding: '8px 6px', textAlign: h === 'Club' ? 'left' : 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444466',
                  fontWeight: 500, letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.rank}
                className={zoneClass(row)}
                style={{
                  borderBottom: '1px solid #0f0f1e',
                  background: row.isUserClub ? `${row.teamId === 'MUN' ? '#DA291C' : row.teamId === 'BAR' ? '#A50044' : '#8899FF'}08` : 'transparent',
                }}
              >
                <td style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{row.rank}</td>
                <td style={{ padding: '9px 6px' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: row.isUserClub ? 700 : 400, color: row.isUserClub ? '#e0e0ee' : '#aaaacc' }}>
                    {row.team}
                  </span>
                </td>
                {[row.w + row.d + row.l, row.w, row.d, row.l, row.gd].map((v, i) => (
                  <td key={i} style={{ padding: '9px 6px', textAlign: 'center', color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{v}</td>
                ))}
                <td style={{ padding: '9px 6px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e0e0ee' }}>{row.pts}</td>
                <td style={{ padding: '9px 6px' }}><FormDots form={row.form} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
