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
    const snap = await db.collection('standings').doc(`${league}-${weekLabel}`).get()

    if (!snap.exists) {
      // Fall back to previous week if current week isn't ready yet
      const prev = await db.collection('standings')
        .where('league', '==', league)
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get()

      if (!prev.empty) {
        const data = prev.docs[0].data()
        return NextResponse.json({ rows: data.rows ?? [], weekLabel: data.weekLabel, stale: true })
      }
      return NextResponse.json({ rows: [], weekLabel, stale: false })
    }

    const data = snap.data()!
    return NextResponse.json({ rows: data.rows ?? [], weekLabel, stale: false })
  } catch (e: any) {
    console.error('[/api/standings]', e?.message)
    return NextResponse.json({ rows: [], weekLabel, error: e?.message }, { status: 500 })
  }
}
