import { NextResponse } from 'next/server'
import { fetchAndUpsertFixtures, fetchAndUpsertStandings } from '@/lib/football-api'
import { generateAndUpsertStories } from '@/lib/gemini'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekLabel = currentWeekLabel()

  const [fixtures, standings, stories] = await Promise.allSettled([
    fetchAndUpsertFixtures(weekLabel),
    fetchAndUpsertStandings(weekLabel),
    generateAndUpsertStories(weekLabel),
  ])

  const results = {
    fixtures: fixtures.status === 'fulfilled' ? 'ok' : `error: ${(fixtures as PromiseRejectedResult).reason?.message}`,
    standings: standings.status === 'fulfilled' ? 'ok' : `error: ${(standings as PromiseRejectedResult).reason?.message}`,
    stories: stories.status === 'fulfilled' ? 'ok' : `error: ${(stories as PromiseRejectedResult).reason?.message}`,
  }

  return NextResponse.json({ success: true, weekLabel, results })
}
