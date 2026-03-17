import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE = 'https://v3.football.api-sports.io'

// UCL knockout round labels from API
const ROUND_ORDER = [
  'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final',
]

export async function GET() {
  if (!process.env.FOOTBALL_API_KEY) {
    return NextResponse.json({ ties: [], round: 'Round of 16' })
  }

  try {
    // Fetch all UCL knockout fixtures for 2025-26
    const url = `${BASE}/fixtures?league=2&season=2025&type=Single`
    const res = await fetch(url, {
      headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()

    const fixtures = (data.response || [])
      .filter((f: any) => {
        const round: string = f.league?.round || ''
        return ROUND_ORDER.some(r => round.includes(r.split('-')[0].trim()))
      })

    // Group by tie (home+away teams, sorted)
    const tieMap: Record<string, any> = {}
    for (const f of fixtures) {
      const key = [f.teams.home.name, f.teams.away.name].sort().join('|')
      if (!tieMap[key]) tieMap[key] = { legs: [] }
      tieMap[key].legs.push({
        home: f.teams.home.name,
        away: f.teams.away.name,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        date: f.fixture.date,
        status: f.fixture.status.short,
        round: f.league.round,
      })
    }

    // Sort legs by date within each tie
    const ties = Object.values(tieMap).map((tie: any) => {
      tie.legs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const latest = tie.legs[tie.legs.length - 1]
      return {
        home: tie.legs[0].home,
        away: tie.legs[0].away,
        leg1: tie.legs[0],
        leg2: tie.legs[1] || null,
        round: latest.round,
        done: tie.legs.every((l: any) => l.status === 'FT'),
      }
    })

    // Find the current active round
    const activeRound = ROUND_ORDER.find(r =>
      ties.some((t: any) => t.round?.includes(r.split('-')[0].trim()) && !t.done)
    ) || ties[0]?.round || 'Round of 16'

    return NextResponse.json({ ties, activeRound })
  } catch (e: any) {
    console.error('[/api/ucl]', e?.message)
    return NextResponse.json({ ties: [], activeRound: 'Round of 16', error: e?.message })
  }
}
