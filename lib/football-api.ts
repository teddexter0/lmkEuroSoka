import { adminDb } from './firebase-admin'
import admin from 'firebase-admin'

const BASE = 'https://v3.football.api-sports.io'
const KEY = process.env.FOOTBALL_API_KEY!

const LEAGUE_IDS: Record<string, number> = {
  EPL: 39,
  LA_LIGA: 140,
  BUNDESLIGA: 78,
  SERIE_A: 135,
  LIGUE_1: 61,
  UCL: 2,
}

// Map API team IDs to our internal IDs
const TEAM_ID_MAP: Record<number, string> = {
  33: 'MUN', 42: 'ARS', 50: 'MCI', 40: 'LFC', 49: 'CFC',
  47: 'TOT', 34: 'NEW', 36: 'FUL', 51: 'BRI', 35: 'BOU',
  52: 'CRY', 45: 'EVE', 66: 'AVL',
  529: 'BAR', 541: 'RMA', 530: 'ATM', 533: 'VIL', 543: 'RBB', 536: 'SEV',
  157: 'BMU', 165: 'BVB', 168: 'LEV', 173: 'RBL',
  505: 'INT', 489: 'ACM', 496: 'JUV', 492: 'NAP', 499: 'ATA',
  85: 'PSG', 91: 'ASM', 81: 'OLM', 79: 'LIL',
  497: 'GAL', 177: 'BOG',
}

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': KEY },
  })
  if (!res.ok) throw new Error(`API-Football error: ${res.status} ${path}`)
  return res.json()
}

export async function fetchAndUpsertFixtures(weekLabel: string) {
  for (const [league, id] of Object.entries(LEAGUE_IDS)) {
    try {
      const [upcoming, recent] = await Promise.all([
        apiFetch(`/fixtures?league=${id}&season=2025&next=7`),
        apiFetch(`/fixtures?league=${id}&season=2025&last=7`),
      ])

      const all = [...(upcoming.response || []), ...(recent.response || [])]

      for (const f of all) {
        const fix = f.fixture
        const home = f.teams.home
        const away = f.teams.away
        const goals = f.goals

        const homeId = TEAM_ID_MAP[home.id] || home.name.slice(0, 3).toUpperCase()
        const awayId = TEAM_ID_MAP[away.id] || away.name.slice(0, 3).toUpperCase()
        const matchDate = new Date(fix.date)
        const docId = `${homeId}-${awayId}-${matchDate.toISOString().split('T')[0]}`

        await adminDb.collection('fixtures').doc(docId).set({
          id: docId,
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeName: home.name,
          awayName: away.name,
          competition: f.league.name,
          league,
          matchDate: admin.firestore.Timestamp.fromDate(matchDate),
          status: fix.status.short === 'FT' ? 'final' : fix.status.short === 'LIVE' ? 'live' : 'scheduled',
          homeScore: goals.home,
          awayScore: goals.away,
          tier: 'watch',
          winProbHome: 0,
          winProbDraw: 0,
          winProbAway: 0,
          preview: '',
          refereeName: fix.referee || '',
          refereeNote: '',
          isDerby: false,
          isPinned: false,
          weekLabel,
        }, { merge: true })
      }
    } catch (e) {
      console.error(`Fixture fetch failed for ${league}:`, e)
    }
  }
}

export async function fetchAndUpsertStandings(weekLabel: string) {
  for (const [league, id] of Object.entries(LEAGUE_IDS)) {
    if (league === 'UCL') continue
    try {
      const data = await apiFetch(`/standings?league=${id}&season=2025`)
      const rows = data.response?.[0]?.league?.standings?.[0] || []

      const standing = rows.map((r: any) => ({
        rank: r.rank,
        team: r.team.name,
        teamId: TEAM_ID_MAP[r.team.id] || '',
        pts: r.points,
        w: r.all.win,
        d: r.all.draw,
        l: r.all.lose,
        gd: `${r.goalsDiff > 0 ? '+' : ''}${r.goalsDiff}`,
        form: (r.form || '').split('').slice(-5).join(''),
      }))

      await adminDb.collection('standings').doc(`${league}-${weekLabel}`).set({
        league, weekLabel, rows: standing, updatedAt: admin.firestore.Timestamp.now(),
      })
    } catch (e) {
      console.error(`Standings fetch failed for ${league}:`, e)
    }
  }
}
