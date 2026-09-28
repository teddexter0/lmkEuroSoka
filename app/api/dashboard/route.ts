import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { TEAMS_SEED } from '@/lib/seed-data'
import { missingFirebaseConfig } from '@/lib/config'
import { getLiveDashboard } from '@/lib/live-dashboard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const weekLabel = req.nextUrl.searchParams.get('week') ?? ''
  if (!weekLabel) {
    return NextResponse.json({ error: 'Missing week param' }, { status: 400 })
  }

  try {
    if (missingFirebaseConfig().length) {
      const data = await getLiveDashboard(weekLabel)
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } })
    }
    const db = getAdminDb()

    const [
      teamsSnap,
      fixturesSnap,
      storiesSnap,
      digestSnap,
      prevWeeksSnap,
      prefsSnap,
      playerStatsSnap,
      refreshSnap,
    ] = await Promise.all([
      db.collection('teams').get(),
      db.collection('fixtures').where('weekLabel', '==', weekLabel).get(),
      db.collection('stories').where('weekLabel', '==', weekLabel).where('isActive', '==', true).get(),
      db.collection('weeklyDigest').doc(weekLabel).get(),
      db.collection('weeklyDigest').orderBy('generatedAt', 'desc').limit(5).get(),
      db.collection('userPreferences').doc('ted').get(),
      db.collection('playerStats').where('statWeek', '==', weekLabel).get(),
      db.collection('system').doc('latest-refresh').get(),
    ])

    let teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Auto-seed teams if collection is empty — TeamSelector needs this to work
    if (teams.length === 0) {
      try {
        await Promise.all(TEAMS_SEED.map(t => db.collection('teams').doc(t.id).set(t)))
        teams = TEAMS_SEED as any[]
        console.log('[dashboard] Teams auto-seeded')
      } catch (e: any) {
        console.error('[dashboard] Team seed failed:', e?.message)
      }
    }
    const savedSelectedTeams: string[] = prefsSnap.exists
      ? (prefsSnap.data()?.selectedTeams ?? [])
      : []

    const fixtures = fixturesSnap.docs
      .map(d => {
        const data = d.data()
        return {
          ...data,
          matchDate: data.matchDate?._seconds
            ? new Date(data.matchDate._seconds * 1000).toISOString()
            : data.matchDate ?? null,
        }
      })
      // Sort by matchDate in JS instead of Firestore (no composite index needed)
      .sort((a, b) => {
        if (!a.matchDate) return 1
        if (!b.matchDate) return -1
        return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
      })

    const stories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const digest = digestSnap.exists ? digestSnap.data() : null
    const prevWeeks = prevWeeksSnap.docs.map(d => d.id)
    const stats = playerStatsSnap.docs.map(d => d.data())
    const standingSnaps = await Promise.all(
      ['EPL', 'LA_LIGA', 'BUNDESLIGA', 'SERIE_A', 'LIGUE_1'].map(league =>
        db.collection('standings').doc(`${league}-${weekLabel}`).get()
      )
    )
    const standings = Object.fromEntries(
      standingSnaps.filter(snap => snap.exists).map(snap => {
        const data = snap.data()!
        return [data.league, data.rows ?? []]
      })
    )
    const refresh = refreshSnap.exists ? refreshSnap.data() : null

    return NextResponse.json(
      { teams, fixtures, stories, digest, prevWeeks, stats, standings, refresh, selectedTeams: savedSelectedTeams },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
    )
  } catch (err: any) {
    console.error('[/api/dashboard] Error:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error', teams: [], fixtures: [], stories: [], digest: null, prevWeeks: [], stats: [], standings: {}, selectedTeams: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  void req
  return NextResponse.json({ error: 'Preferences are stored privately in this browser' }, { status: 405, headers: { Allow: 'GET' } })
}
