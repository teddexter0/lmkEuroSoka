'use client'

const R16_TIES = [
  { home: 'Newcastle',   away: 'Barcelona',      leg1: 'Mar 10', leg2: 'Mar 18', homeId: 'NEW', awayId: 'BAR', tier: 'unmissable' },
  { home: 'Galatasaray', away: 'Liverpool',       leg1: 'Mar 10', leg2: 'Mar 18', homeId: 'GAL', awayId: 'LFC', tier: 'watch' },
  { home: 'Atlético',    away: 'Spurs',           leg1: 'Mar 10', leg2: 'Mar 18', homeId: 'ATM', awayId: 'TOT', tier: 'watch' },
  { home: 'Atalanta',    away: 'Bayern Munich',   leg1: 'Mar 10', leg2: 'Mar 18', homeId: 'ATA', awayId: 'BMU', tier: 'watch' },
  { home: 'Leverkusen',  away: 'Arsenal',         leg1: 'Mar 11', leg2: 'Mar 18', homeId: 'LEV', awayId: 'ARS', tier: 'unmissable' },
  { home: 'Real Madrid', away: 'Man City',        leg1: 'Mar 11', leg2: 'Mar 17', homeId: 'RMA', awayId: 'MCI', tier: 'unmissable' },
  { home: 'PSG',         away: 'Chelsea',         leg1: 'Mar 11', leg2: 'Mar 18', homeId: 'PSG', awayId: 'CFC', tier: 'watch' },
  { home: 'Bodo/Glimt',  away: 'Sporting CP',     leg1: 'Mar 10', leg2: 'Mar 17', homeId: 'BOG', awayId: 'SPO', tier: 'watch' },
]

const TIER_COLOR: Record<string, string> = { unmissable: '#FF4500', priority: '#FFD700', watch: '#00BFFF' }

export default function UCLBracket() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#F5C842' }}>
          ⭐ UCL Round of 16
        </h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444466' }}>
          Final: Budapest · May 30
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {R16_TIES.map((tie, i) => (
          <div key={i} style={{
            background: '#0a0a14', border: `1px solid ${TIER_COLOR[tie.tier]}28`,
            borderRadius: 8, padding: '12px 14px',
            borderLeft: `3px solid ${TIER_COLOR[tie.tier]}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#e0e0ee' }}>
                  {tie.home} <span style={{ color: '#444466' }}>vs</span> {tie.away}
                </p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#778899', marginTop: 4 }}>
                  L1: {tie.leg1} · L2: {tie.leg2}
                </p>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: TIER_COLOR[tie.tier], textAlign: 'right' }}>
                {tie.tier.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', background: '#0a0a14', borderRadius: 8, border: '1px solid #F5C84228' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F5C842', marginBottom: 6 }}>📅 UCL CALENDAR</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[
            ['R16 Leg 1', 'Mar 10–11'],
            ['R16 Leg 2', 'Mar 17–18'],
            ['QF Leg 1',  'Apr 7–8'],
            ['QF Leg 2',  'Apr 14–15'],
            ['SF Leg 1',  'Apr 28–29'],
            ['SF Leg 2',  'May 5–6'],
            ['FINAL',     'May 30 · Budapest'],
          ].map(([stage, date]) => (
            <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#778899', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{stage}</span>
              <span style={{ color: '#aaaacc', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
