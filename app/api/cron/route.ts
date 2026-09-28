import { NextResponse } from 'next/server'
import { fetchAndUpsertFixtures, fetchAndUpsertStandings, fetchAndUpsertPlayerStats } from '@/lib/football-api'
import { generateAndUpsertStories, generateAndUpsertDigest } from '@/lib/editorial'
import { currentWeekLabel } from '@/lib/utils'
import { isAuthorizedJobRequest } from '@/lib/cron-auth'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { missingFirebaseConfig } from '@/lib/config'
import { getLiveDashboard } from '@/lib/live-dashboard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!isAuthorizedJobRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekLabel = currentWeekLabel()
  const startedAt = Date.now()
  if (missingFirebaseConfig().length) {
    const data = await getLiveDashboard(weekLabel)
    return NextResponse.json({
      success: data.fixtures.length > 0,
      weekLabel,
      mode: 'zero-config-live-cache',
      durationMs: Date.now() - startedAt,
      results: { fixtures: data.fixtures.length, stories: data.stories.length, standings: Object.keys(data.standings).length },
    }, { status: data.fixtures.length > 0 ? 200 : 503 })
  }
  const run = async (name: string, job: () => Promise<unknown>) => {
    const start = Date.now()
    try {
      const value = await job()
      return { name, ok: true, durationMs: Date.now() - start, value }
    }
    catch (error) { return { name, ok: false, durationMs: Date.now() - start, error: error instanceof Error ? error.message : String(error) } }
  }

  const dataResults = await Promise.all([
    run('fixtures', () => fetchAndUpsertFixtures(weekLabel)),
    run('standings', () => fetchAndUpsertStandings(weekLabel)),
    run('playerStats', () => fetchAndUpsertPlayerStats(weekLabel)),
  ])
  const editorialResults = await Promise.all([
    run('stories', () => generateAndUpsertStories(weekLabel)),
    run('digest', () => generateAndUpsertDigest(weekLabel)),
  ])
  const results = [...dataResults, ...editorialResults]
  const success = results.every(result => result.ok)
  const db = getAdminDb()
  await db.collection('system').doc('latest-refresh').set({
    weekLabel, success, results, startedAt: Timestamp.fromMillis(startedAt),
    completedAt: Timestamp.now(), durationMs: Date.now() - startedAt,
  }, { merge: true })

  return NextResponse.json({ success, weekLabel, durationMs: Date.now() - startedAt, results }, { status: success ? 200 : 207 })
}
