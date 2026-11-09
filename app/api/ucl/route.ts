import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPORTS_DB_BASE = 'https://www.thesportsdb.com/api/v1/json/123'
const UCL_LEAGUE_ID = '4480'

function eventDate(event: any): string {
  const raw = event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`
  return /[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}Z`
}

function normalizeEvent(event: any) {
  const finished = event.intHomeScore !== null && event.intAwayScore !== null
  const leg = {
    home: event.strHomeTeam,
    away: event.strAwayTeam,
    homeScore: finished ? Number(event.intHomeScore) : null,
    awayScore: finished ? Number(event.intAwayScore) : null,
    date: eventDate(event),
    status: finished ? 'FT' : 'NS',
    round: event.strRound || event.strGroup || 'League phase',
  }
  return {
    id: String(event.idEvent),
    home: leg.home,
    away: leg.away,
    leg1: leg,
    leg2: null,
    round: leg.round,
    done: finished,
  }
}

async function sportsDb(path: string) {
  const response = await fetch(`${SPORTS_DB_BASE}/${path}`, {
    next: { revalidate: 900 },
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`Champions League feed returned ${response.status}`)
  return response.json()
}

export async function GET() {
  try {
    const [past, upcoming] = await Promise.all([
      sportsDb(`eventspastleague.php?id=${UCL_LEAGUE_ID}`),
      sportsDb(`eventsnextleague.php?id=${UCL_LEAGUE_ID}`),
    ])
    const events = [...(past.events || []), ...(upcoming.events || [])]
    const ties = [...new Map(events.map((event: any) => [String(event.idEvent), normalizeEvent(event)])).values()]
      .sort((a: any, b: any) => new Date(a.leg1.date).getTime() - new Date(b.leg1.date).getTime())
    const activeRound = ties.find((tie: any) => !tie.done)?.round || ties.at(-1)?.round || 'League phase'

    return NextResponse.json(
      { ties, activeRound, source: 'thesportsdb' },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Champions League feed unavailable'
    console.error('[/api/ucl]', message)
    return NextResponse.json({ ties: [], activeRound: 'League phase', error: message }, { status: 502 })
  }
}
