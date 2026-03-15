import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { currentWeekLabel } from '@/lib/utils'
import {
  TEAMS_SEED,
  FIXTURES_SEED,
  STORIES_SEED,
  PLAYER_STATS_SEED,
  WEEKLY_DIGEST_SEED,
} from '@/lib/seed-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Seeding all collections can take a while — give it plenty of room
export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const week = currentWeekLabel()
    const counts = { teams: 0, fixtures: 0, stories: 0, stats: 0, digest: false, prefs: false }

    // Teams
    await Promise.all(
      TEAMS_SEED.map(team =>
        db.collection('teams').doc(team.id).set(team).then(() => counts.teams++)
      )
    )

    // Fixtures — convert matchDate string → Timestamp, override weekLabel to current week
    await Promise.all(
      FIXTURES_SEED.map(fixture =>
        db.collection('fixtures').doc(fixture.id).set({
          ...fixture,
          weekLabel: week,
          matchDate: Timestamp.fromDate(new Date(fixture.matchDate as string)),
        }).then(() => counts.fixtures++)
      )
    )

    // Stories — override weekLabel to current week
    await Promise.all(
      STORIES_SEED.map(story => {
        const id = story.id.replace(/mar-\d+-\d+/, week)
        return db.collection('stories').doc(id).set({
          ...story,
          id,
          weekLabel: week,
          createdAt: Timestamp.now(),
        }).then(() => counts.stories++)
      })
    )

    // Player stats — override statWeek to current week
    await Promise.all(
      PLAYER_STATS_SEED.map(stat => {
        const statWithWeek = { ...stat, statWeek: week }
        const id = `${stat.teamId}-${stat.playerName.replace(/\s+/g, '-')}-${week}`
        return db.collection('playerStats').doc(id).set(statWithWeek).then(() => counts.stats++)
      })
    )

    // Weekly digest — keyed by current week
    await db.collection('weeklyDigest').doc(week).set({
      ...WEEKLY_DIGEST_SEED,
      weekLabel: week,
      generatedAt: Timestamp.now(),
    })
    counts.digest = true

    // User preferences
    await db.collection('userPreferences').doc('ted').set({
      selectedTeams: ['MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY','ATM','RMA','PSG','BMU','BVB','LEV','INT','ACM','JUV','ASM'],
      activeLeague: 'EPL',
      updatedAt: Timestamp.now(),
    })
    counts.prefs = true

    return NextResponse.json({ success: true, week, seeded: counts })
  } catch (err: any) {
    console.error('[/api/admin/seed] Error:', err?.message ?? err)
    return NextResponse.json({ error: err?.message ?? 'Seed failed' }, { status: 500 })
  }
}
