import { NextResponse } from 'next/server'
import { fetchAndUpsertFixtures, fetchAndUpsertStandings } from '@/lib/football-api'
import { generateAndUpsertStories } from '@/lib/gemini'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekLabel = currentWeekLabel()
  const results: Record<string, string> = {}

  try {
    await fetchAndUpsertFixtures(weekLabel)
    results.fixtures = 'ok'
  } catch (e: any) {
    results.fixtures = `error: ${e.message}`
  }

  try {
    await fetchAndUpsertStandings(weekLabel)
    results.standings = 'ok'
  } catch (e: any) {
    results.standings = `error: ${e.message}`
  }

  try {
    await generateAndUpsertStories(weekLabel)
    results.stories = 'ok'
  } catch (e: any) {
    results.stories = `error: ${e.message}`
  }

  return NextResponse.json({ success: true, weekLabel, results })
}
