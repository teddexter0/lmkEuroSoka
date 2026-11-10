import { NextRequest, NextResponse } from 'next/server'
import { isLeague } from '@/lib/competitions'
import { getSeasonPlayers } from '@/lib/player-stats'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league') ?? ''
  if (!isLeague(league)) return NextResponse.json({ error: 'Unknown competition' }, { status: 400 })
  const clubId = request.nextUrl.searchParams.get('club') ?? undefined
  if (clubId != null && !/^\d{1,10}$/.test(clubId)) return NextResponse.json({ error: 'Unknown club' }, { status: 400 })
  const today = new Date()
  const year = today.getUTCFullYear() - (today.getUTCMonth() < 6 ? 1 : 0)
  try {
    return NextResponse.json(await getSeasonPlayers(league, year, clubId))
  } catch (error) {
    console.warn(`[player-stats] ${league}`, error)
    return NextResponse.json({ error: 'Season player numbers are temporarily unavailable from the data provider.' }, { status: 503 })
  }
}
