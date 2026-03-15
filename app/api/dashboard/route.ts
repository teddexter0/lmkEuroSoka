import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const weekLabel = req.nextUrl.searchParams.get('week') ?? ''
  if (!weekLabel) {
    return NextResponse.json({ error: 'Missing week param' }, { status: 400 })
  }

  try {
    const db = getAdminDb()

    const priority = ['MUN', 'BAR', 'ARS', 'MCI', 'LFC', 'CFC', 'NEW', 'PSG', 'BMU']

    const [
      teamsSnap,
      fixturesSnap,
      storiesSnap,
      digestSnap,
      prevWeeksSnap,
      ...statSnaps
    ] = await Promise.all([
      db.collection('teams').get(),
      // No orderBy here — avoids requiring a composite Firestore index
      db.collection('fixtures').where('weekLabel', '==', weekLabel).get(),
      db.collection('stories').where('weekLabel', '==', weekLabel).where('isActive', '==', true).get(),
      db.collection('weeklyDigest').doc(weekLabel).get(),
      db.collection('weeklyDigest').orderBy('generatedAt', 'desc').limit(5).get(),
      ...priority.map(id =>
        db.collection('playerStats')
          .where('teamId', '==', id)
          .where('statWeek', '==', weekLabel)
          .get()
      ),
    ])

    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

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
    const stats = statSnaps.flatMap(snap => snap.docs.map(d => d.data()))

    return NextResponse.json({ teams, fixtures, stories, digest, prevWeeks, stats })
  } catch (err: any) {
    console.error('[/api/dashboard] Error:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error', teams: [], fixtures: [], stories: [], digest: null, prevWeeks: [], stats: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { selectedTeams } = body
    if (!Array.isArray(selectedTeams)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const db = getAdminDb()
    await db.collection('userPreferences').doc('ted').set(
      { selectedTeams, updatedAt: new Date() },
      { merge: true }
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[/api/dashboard POST] Error:', err?.message ?? err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
