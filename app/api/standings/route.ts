import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get('league') ?? 'EPL'
  const weekLabel = currentWeekLabel()

  try {
    const db = getAdminDb()

    // Try current week first
    const snap = await db.collection('standings').doc(`${league}-${weekLabel}`).get()
    if (snap.exists) {
      const data = snap.data()!
      return NextResponse.json({ rows: data.rows ?? [], weekLabel, stale: false })
    }

    // Fallback: any previous week for this league (no orderBy = no composite index needed)
    try {
      const prev = await db.collection('standings')
        .where('league', '==', league)
        .limit(5)
        .get()

      if (!prev.empty) {
        // Sort in JS to avoid needing a Firestore composite index
        const sorted = prev.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.updatedAt?._seconds ?? 0) - (a.updatedAt?._seconds ?? 0))
        const data = sorted[0] as any
        return NextResponse.json({ rows: data.rows ?? [], weekLabel: data.weekLabel, stale: true })
      }
    } catch {
      // No previous data either — return empty (UI will show static fallback)
    }

    return NextResponse.json({ rows: [], weekLabel, stale: false })
  } catch (e: any) {
    console.error('[/api/standings]', e?.message)
    // Return empty rows (never 500) — UI has static fallback
    return NextResponse.json({ rows: [], weekLabel, stale: true })
  }
}
