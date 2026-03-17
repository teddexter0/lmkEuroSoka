import { NextResponse } from 'next/server'
import { fetchAndUpsertFixtures, fetchAndUpsertStandings } from '@/lib/football-api'
import { generateAndUpsertStories, generateAndUpsertDigest } from '@/lib/gemini'
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

  // Step 1: fetch live data first (fixtures needed for digest context)
  const [fixtures, standings] = await Promise.allSettled([
    fetchAndUpsertFixtures(weekLabel),
    fetchAndUpsertStandings(weekLabel),
  ])

  // Step 2: generate AI content (stories + digest) after fixtures are in DB
  const [stories, digest] = await Promise.allSettled([
    generateAndUpsertStories(weekLabel),
    generateAndUpsertDigest(weekLabel),
  ])

  const results = {
    fixtures: fixtures.status === 'fulfilled' ? 'ok' : `error: ${(fixtures as PromiseRejectedResult).reason?.message}`,
    standings: standings.status === 'fulfilled' ? 'ok' : `error: ${(standings as PromiseRejectedResult).reason?.message}`,
    stories: stories.status === 'fulfilled' ? 'ok' : `error: ${(stories as PromiseRejectedResult).reason?.message}`,
    digest: digest.status === 'fulfilled' ? 'ok' : `error: ${(digest as PromiseRejectedResult).reason?.message}`,
  }

  return NextResponse.json({ success: true, weekLabel, results })
}
