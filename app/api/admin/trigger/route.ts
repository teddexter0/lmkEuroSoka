import { NextRequest, NextResponse } from 'next/server'
import { fetchAndUpsertFixtures, fetchAndUpsertStandings } from '@/lib/football-api'
import { generateAndUpsertStories, generateAndUpsertDigest } from '@/lib/gemini'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json()
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const weekLabel = currentWeekLabel()

  const [fixtures, standings] = await Promise.allSettled([
    fetchAndUpsertFixtures(weekLabel),
    fetchAndUpsertStandings(weekLabel),
  ])

  const [stories, digest] = await Promise.allSettled([
    generateAndUpsertStories(weekLabel),
    generateAndUpsertDigest(weekLabel),
  ])

  return NextResponse.json({
    ok: true,
    weekLabel,
    results: {
      fixtures:  fixtures.status  === 'fulfilled' ? 'ok' : `error: ${(fixtures  as PromiseRejectedResult).reason?.message}`,
      standings: standings.status === 'fulfilled' ? 'ok' : `error: ${(standings as PromiseRejectedResult).reason?.message}`,
      stories:   stories.status   === 'fulfilled' ? 'ok' : `error: ${(stories   as PromiseRejectedResult).reason?.message}`,
      digest:    digest.status    === 'fulfilled' ? 'ok' : `error: ${(digest    as PromiseRejectedResult).reason?.message}`,
    },
  })
}
