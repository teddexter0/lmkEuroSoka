import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const weekLabel = currentWeekLabel()

  // Check env vars (never expose actual values)
  const envCheck = {
    FIREBASE_PROJECT_ID:   !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY:  !!process.env.FIREBASE_PRIVATE_KEY,
    FOOTBALL_API_KEY:      !!process.env.FOOTBALL_API_KEY,
    ANTHROPIC_API_KEY:     !!process.env.ANTHROPIC_API_KEY,
    YOUTUBE_API_KEY:       !!process.env.YOUTUBE_API_KEY,
    CRON_SECRET:           !!process.env.CRON_SECRET,
  }

  const allEnvSet = Object.values(envCheck).every(Boolean)

  // Firebase counts
  let firebase: Record<string, any> = { status: 'not_tested' }
  try {
    const db = getAdminDb()
    const [teams, fixtures, stories, digest, standings, prefs] = await Promise.all([
      db.collection('teams').count().get(),
      db.collection('fixtures').where('weekLabel', '==', weekLabel).count().get(),
      db.collection('stories').where('weekLabel', '==', weekLabel).count().get(),
      db.collection('weeklyDigest').doc(weekLabel).get(),
      db.collection('standings').count().get(),
      db.collection('userPreferences').doc('ted').get(),
    ])

    firebase = {
      status: 'connected',
      weekLabel,
      teams:    teams.data().count,
      fixtures: fixtures.data().count,
      stories:  stories.data().count,
      digest:   digest.exists ? 'exists' : 'MISSING',
      standings: standings.data().count,
      userPrefs: prefs.exists ? 'exists' : 'missing',
      diagnosis: [] as string[],
    }

    if (firebase.fixtures === 0)  firebase.diagnosis.push('No fixtures for this week — cron has not run yet')
    if (firebase.stories === 0)   firebase.diagnosis.push('No stories for this week — cron has not run yet')
    if (firebase.digest === 'MISSING') firebase.diagnosis.push('No weekly digest — cron has not run yet')
    if (firebase.standings === 0) firebase.diagnosis.push('No standings saved — cron has not run yet')
    if (firebase.teams === 0)     firebase.diagnosis.push('No teams in DB — run /api/admin/seed first')
    if (firebase.diagnosis.length === 0) firebase.diagnosis.push('All good — data exists for this week')
  } catch (e: any) {
    firebase = { status: 'ERROR', error: e?.message ?? String(e) }
  }

  // Football API quick check (1 request)
  let footballApi: Record<string, any> = { status: 'not_tested' }
  if (process.env.FOOTBALL_API_KEY) {
    try {
      const res = await fetch('https://v3.football.api-sports.io/status', {
        headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
      })
      const data = await res.json()
      footballApi = {
        status: res.ok ? 'ok' : 'error',
        account: data.response?.account?.login ?? 'unknown',
        requestsToday: data.response?.requests?.current ?? 'unknown',
        requestsLimit: data.response?.requests?.limit_day ?? 'unknown',
        plan: data.response?.subscription?.plan ?? 'unknown',
      }
    } catch (e: any) {
      footballApi = { status: 'ERROR', error: e?.message }
    }
  }

  return NextResponse.json({
    weekLabel,
    allEnvSet,
    envCheck,
    firebase,
    footballApi,
    hint: !allEnvSet
      ? 'Missing env vars — check Vercel settings'
      : firebase.status === 'ERROR'
      ? 'Firebase connection failed — check FIREBASE_PRIVATE_KEY format (\\n not literal newlines)'
      : 'To populate data: POST /api/cron with Authorization: Bearer <CRON_SECRET>',
  }, { status: 200 })
}
