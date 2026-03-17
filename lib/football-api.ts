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
  52: 'CRY', 45: 'EVE', 66: 'AVL', 46: 'LEI', 55: 'WHU',
  48: 'WOL', 39: 'WIG', 69: 'IPS', 41: 'SOT', 44: 'BUR',
  // La Liga
  529: 'BAR', 541: 'RMA', 530: 'ATM', 533: 'VIL', 543: 'RBB', 536: 'SEV',
  532: 'VAL', 728: 'RAY', 534: 'ATH', 548: 'ESP', 531: 'GIR',
  // Bundesliga
  157: 'BMU', 165: 'BVB', 168: 'LEV', 173: 'RBL', 169: 'SGE',
  163: 'BOC', 172: 'SCF', 167: 'TSG', 171: 'WER', 162: 'AUG',
  // Serie A
  505: 'INT', 489: 'ACM', 496: 'JUV', 492: 'NAP', 499: 'ATA',
  487: 'ROM', 488: 'LAZ', 497: 'FIO', 490: 'PAR', 502: 'TOR',
  // Ligue 1
  85: 'PSG', 91: 'ASM', 81: 'OLM', 79: 'LIL', 80: 'LYO',
  84: 'NIC', 94: 'REN', 95: 'STR', 93: 'LOR', 111: 'MON',
  // UCL others
  497: 'GAL', 177: 'BOG', 568: 'SPO',
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
      // Deduplicate by fixture ID
      const seen = new Set<number>()
      const unique = all.filter(f => {
        if (seen.has(f.fixture.id)) return false
        seen.add(f.fixture.id)
        return true
      })

      for (const f of unique) {
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
        played: r.all.played,
        w: r.all.win,
        d: r.all.draw,
        l: r.all.lose,
        gd: `${r.goalsDiff > 0 ? '+' : ''}${r.goalsDiff}`,
        form: (r.form || '').split('').slice(-5).join(''),
        // Zone flags derived from rank
        isTopFour: r.rank <= 4,
        isRelegation: r.rank >= rows.length - 2,
        isUserClub: false,
        isWatch: false,
      }))

      await adminDb.collection('standings').doc(`${league}-${weekLabel}`).set({
        league, weekLabel, rows: standing, updatedAt: admin.firestore.Timestamp.now(),
      })
    } catch (e) {
      console.error(`Standings fetch failed for ${league}:`, e)
    }
  }
}

// Fetch top scorers + assisters per league and store as playerStats
export async function fetchAndUpsertPlayerStats(weekLabel: string) {
  for (const [league, id] of Object.entries(LEAGUE_IDS)) {
    if (league === 'UCL') continue
    try {
      const [scorersData, assistsData] = await Promise.all([
        apiFetch(`/players/topscorers?league=${id}&season=2025`),
        apiFetch(`/players/topassists?league=${id}&season=2025`),
      ])

      // Build map of player data keyed by player ID
      const playerMap: Record<string, any> = {}

      for (const item of (scorersData.response || []).slice(0, 25)) {
        const p = item.player
        const s = item.statistics?.[0]
        if (!s) continue
        const teamId = TEAM_ID_MAP[s.team?.id] || ''
        const key = `${teamId || s.team?.id}-${p.id}`
        playerMap[key] = {
          teamId,
          teamName: s.team?.name || '',
          playerName: p.name,
          position: s.games?.position || 'Unknown',
          goals: s.goals?.total || 0,
          assists: s.goals?.assists || 0,
          minutesPlayed: s.games?.minutes || 0,
          appearances: s.games?.appearences || 0, // API typo
          xg: parseFloat(s.goals?.total?.toString() || '0'), // proxy — real xG on paid tier
          chancesCreated: s.passes?.key || 0,
          ballRetentionPct: parseFloat(s.passes?.accuracy?.toString() || '0'),
          isInjured: false,
          statWeek: weekLabel,
          league,
        }
      }

      for (const item of (assistsData.response || []).slice(0, 25)) {
        const p = item.player
        const s = item.statistics?.[0]
        if (!s) continue
        const teamId = TEAM_ID_MAP[s.team?.id] || ''
        const key = `${teamId || s.team?.id}-${p.id}`
        if (playerMap[key]) {
          playerMap[key].assists = s.goals?.assists || playerMap[key].assists
        } else {
          playerMap[key] = {
            teamId,
            teamName: s.team?.name || '',
            playerName: p.name,
            position: s.games?.position || 'Unknown',
            goals: s.goals?.total || 0,
            assists: s.goals?.assists || 0,
            minutesPlayed: s.games?.minutes || 0,
            appearances: s.games?.appearences || 0,
            xg: 0,
            chancesCreated: s.passes?.key || 0,
            ballRetentionPct: parseFloat(s.passes?.accuracy?.toString() || '0'),
            isInjured: false,
            statWeek: weekLabel,
            league,
          }
        }
      }

      // Write each player to Firebase
      await Promise.all(
        Object.entries(playerMap).map(([key, player]) =>
          adminDb.collection('playerStats').doc(`${key}-${weekLabel}`).set(player, { merge: true })
        )
      )
      console.log(`✓ Player stats saved for ${league}: ${Object.keys(playerMap).length} players`)
    } catch (e) {
      console.error(`Player stats fetch failed for ${league}:`, e)
    }
  }
}
