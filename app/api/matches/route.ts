import { NextRequest, NextResponse } from 'next/server'
import { isLeague } from '@/lib/competitions'
import { fetchEspnFixtures } from '@/lib/espn'
import { currentWeekLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league') ?? ''
  const start = request.nextUrl.searchParams.get('start') ?? ''
  if (!isLeague(league) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return NextResponse.json({ error: 'Choose a competition and a valid start date.' }, { status: 400 })
  }
  const utc = new Date(`${start}T00:00:00Z`)
  if (!Number.isFinite(+utc) || utc.toISOString().slice(0, 10) !== start ||
    Math.abs(Date.now() - +utc) > 370 * 86_400_000) {
    return NextResponse.json({ error: 'Choose a date within one year of today.' }, { status: 400 })
  }
  try {
    const result = await fetchEspnFixtures(league, currentWeekLabel(), +utc - 3 * 3_600_000)
    return NextResponse.json({ fixtures: result.fixtures, incomplete: result.partial })
  } catch {
    return NextResponse.json({ error: 'The schedule feed is unavailable for that week.' }, { status: 503 })
  }
}
