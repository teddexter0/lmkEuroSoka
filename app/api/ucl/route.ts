import { NextRequest, NextResponse } from 'next/server'
import { getLiveDashboard } from '@/lib/live-dashboard'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league') === 'UWCL' ? 'UWCL' : 'UCL'
  const { fixtures, unavailableSchedules } = await getLiveDashboard(currentWeekLabel())
  const ties = fixtures.filter(match => match.league === league).map(match => {
    const round = match.round || 'Champions League'
    const leg1 = {
      home: match.homeName, away: match.awayName, homeScore: match.homeScore ?? null,
      awayScore: match.awayScore ?? null, date: match.matchDate,
      status: match.status === 'final' ? 'FT' : match.status === 'live' ? 'LIVE' : 'NS', round,
    }
    return { id: match.id, home: leg1.home, away: leg1.away, leg1, leg2: null, round, done: match.status === 'final' }
  })
  if (!ties.length && unavailableSchedules.includes(league)) {
    return NextResponse.json({ error: 'Champions League schedule coverage is currently unavailable.' }, { status: 503 })
  }
  return NextResponse.json({ ties, activeRound: ties.find(tie => !tie.done)?.round || ties.at(-1)?.round || '', source: 'ESPN' })
}
