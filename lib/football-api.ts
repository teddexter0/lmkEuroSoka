import admin from 'firebase-admin'
import { adminDb } from './firebase-admin'
import { footballProviderName } from './config'
import { fetchSportsDbFixtures, fetchSportsDbStandings } from './sportsdb'

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io'
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4'
const LEAGUES = {
  EPL: { apiFootball: 39, footballData: 'PL' }, LA_LIGA: { apiFootball: 140, footballData: 'PD' },
  BUNDESLIGA: { apiFootball: 78, footballData: 'BL1' }, SERIE_A: { apiFootball: 135, footballData: 'SA' },
  LIGUE_1: { apiFootball: 61, footballData: 'FL1' }, UCL: { apiFootball: 2, footballData: 'CL' },
} as const

const TEAM_ID_MAP: Record<number, string> = {
  33: 'MUN', 42: 'ARS', 50: 'MCI', 40: 'LFC', 49: 'CFC',
  47: 'TOT', 34: 'NEW', 36: 'FUL', 51: 'BRI', 35: 'BOU',
  52: 'CRY', 45: 'EVE', 66: 'AVL', 46: 'LEI', 55: 'WHU',
  48: 'WOL', 39: 'WIG', 69: 'IPS', 41: 'SOT', 44: 'BUR',
  // La Liga
  529: 'BAR', 541: 'RMA', 530: 'ATM', 533: 'VIL', 543: 'RBB', 536: 'SEV',
  532: 'VAL', 728: 'RAY', 534: 'ATH', 539: 'ESP', 531: 'GIR',
  // Bundesliga
  157: 'BMU', 165: 'BVB', 168: 'LEV', 173: 'RBL', 169: 'SGE',
  163: 'BOC', 172: 'SCF', 167: 'TSG', 171: 'WER', 162: 'AUG',
  // Serie A (correct API-Sports IDs: Roma=497, Lazio=487, Fiorentina=502)
  505: 'INT', 489: 'ACM', 496: 'JUV', 492: 'NAP', 499: 'ATA',
  487: 'LAZ', 497: 'ROM', 502: 'FIO', 494: 'PAR', 503: 'TOR',
  // Ligue 1
  85: 'PSG', 91: 'ASM', 81: 'OLM', 79: 'LIL', 80: 'LYO',
  84: 'NIC', 94: 'REN', 95: 'STR', 93: 'LOR', 111: 'MON',
  // UCL others (Galatasaray=548, Bodo/Glimt=177, Sporting CP=568)
  548: 'GAL', 177: 'BOG', 568: 'SPO',
}
const TEAM_NAME_MAP: Record<string, string> = {
  'Manchester United FC':'MUN','Arsenal FC':'ARS','Manchester City FC':'MCI','Liverpool FC':'LFC','Chelsea FC':'CFC',
  'Tottenham Hotspur FC':'TOT','Newcastle United FC':'NEW','Fulham FC':'FUL','Brighton & Hove Albion FC':'BRI',
  'AFC Bournemouth':'BOU','Crystal Palace FC':'CRY','Everton FC':'EVE','Aston Villa FC':'AVL','FC Barcelona':'BAR',
  'Real Madrid CF':'RMA','Club Atlético de Madrid':'ATM','FC Bayern München':'BMU','Borussia Dortmund':'BVB',
  'Bayer 04 Leverkusen':'LEV','FC Internazionale Milano':'INT','AC Milan':'ACM','Juventus FC':'JUV','SSC Napoli':'NAP',
  'Atalanta BC':'ATA','Paris Saint-Germain FC':'PSG','AS Monaco FC':'ASM','Olympique de Marseille':'OLM','Lille OSC':'LIL',
}

export interface SyncResult { provider: string; written: number; failedLeagues: string[] }

function seasonFor(date = new Date()): number {
  return date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1
}
function internalTeamId(name: string, numericId?: number): string {
  return (numericId && TEAM_ID_MAP[numericId]) || TEAM_NAME_MAP[name] || name.replace(/\b(FC|CF|AFC|AC|AS)\b/gi,'').replace(/[^a-z]/gi,'').slice(0,3).toUpperCase()
}
async function jsonFetch(url: string, headers: HeadersInit): Promise<any> {
  const response = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`Football provider returned ${response.status}`)
  return response.json()
}
function fixtureStatus(short: string): 'scheduled' | 'live' | 'final' {
  if (['FT','AET','PEN','FINISHED'].includes(short)) return 'final'
  if (['NS','TBD','SCHEDULED','TIMED','POSTPONED'].includes(short)) return 'scheduled'
  return 'live'
}
async function writeFixtures(fixtures: Array<Record<string, any>>): Promise<number> {
  const unique = new Map(fixtures.map(f => [f.id, f]))
  const batch = adminDb.batch()
  for (const fixture of unique.values()) batch.set(adminDb.collection('fixtures').doc(fixture.id), fixture, { merge: true })
  if (unique.size) await batch.commit()
  return unique.size
}

async function syncApiFootballFixtures(weekLabel: string): Promise<SyncResult> {
  const season = seasonFor()
  const jobs = await Promise.allSettled(Object.entries(LEAGUES).map(async ([league, ids]) => {
    const headers = { 'x-apisports-key': process.env.FOOTBALL_API_KEY || '' }
    const [upcoming, recent] = await Promise.all([
      jsonFetch(`${API_FOOTBALL_BASE}/fixtures?league=${ids.apiFootball}&season=${season}&next=7`, headers),
      jsonFetch(`${API_FOOTBALL_BASE}/fixtures?league=${ids.apiFootball}&season=${season}&last=7`, headers),
    ])
    const fixtures = [...(upcoming.response || []), ...(recent.response || [])].map((row: any) => {
      const date = new Date(row.fixture.date), homeId = internalTeamId(row.teams.home.name, row.teams.home.id), awayId = internalTeamId(row.teams.away.name, row.teams.away.id)
      return { id:String(row.fixture.id || `${homeId}-${awayId}-${date.toISOString()}`), homeTeamId:homeId, awayTeamId:awayId,
        homeName:row.teams.home.name, awayName:row.teams.away.name, competition:row.league.name, league,
        matchDate:admin.firestore.Timestamp.fromDate(date), status:fixtureStatus(row.fixture.status.short),
        homeScore:row.goals.home, awayScore:row.goals.away, tier:'watch', winProbHome:0, winProbDraw:0, winProbAway:0,
        preview:'', refereeName:row.fixture.referee || '', refereeNote:'', isDerby:false, isPinned:false, weekLabel,
        source:'api-football', updatedAt:admin.firestore.Timestamp.now() }
    })
    return writeFixtures(fixtures)
  }))
  return { provider:'api-football', written:jobs.reduce((n,j)=>n+(j.status==='fulfilled'?j.value:0),0),
    failedLeagues:jobs.flatMap((j,i)=>j.status==='rejected'?[Object.keys(LEAGUES)[i]]:[]) }
}

async function syncFootballDataFixtures(weekLabel: string): Promise<SyncResult> {
  const competitions = Object.values(LEAGUES).map(item => item.footballData).join(',')
  const from = new Date(Date.now()-7*86_400_000).toISOString().slice(0,10), to = new Date(Date.now()+14*86_400_000).toISOString().slice(0,10)
  const data = await jsonFetch(`${FOOTBALL_DATA_BASE}/matches?competitions=${competitions}&dateFrom=${from}&dateTo=${to}`, { 'X-Auth-Token':process.env.FOOTBALL_DATA_API_KEY || '' })
  const leagueByCode: Record<string,string> = Object.fromEntries(Object.entries(LEAGUES).map(([key,value])=>[value.footballData,key]))
  const fixtures = (data.matches || []).map((match:any) => {
    const date=new Date(match.utcDate), homeId=internalTeamId(match.homeTeam.name), awayId=internalTeamId(match.awayTeam.name)
    return { id:String(match.id || `${homeId}-${awayId}-${date.toISOString()}`), homeTeamId:homeId, awayTeamId:awayId,
      homeName:match.homeTeam.name, awayName:match.awayTeam.name, competition:match.competition.name,
      league:leagueByCode[match.competition.code] || match.competition.code, matchDate:admin.firestore.Timestamp.fromDate(date),
      status:fixtureStatus(match.status), homeScore:match.score?.fullTime?.home, awayScore:match.score?.fullTime?.away,
      tier:'watch', winProbHome:0, winProbDraw:0, winProbAway:0, preview:'', refereeName:match.referees?.[0]?.name || '',
      refereeNote:'', isDerby:false, isPinned:false, weekLabel, source:'football-data', updatedAt:admin.firestore.Timestamp.now() }
  })
  return { provider:'football-data', written:await writeFixtures(fixtures), failedLeagues:[] }
}

export async function fetchAndUpsertFixtures(weekLabel:string):Promise<SyncResult> {
  const provider=footballProviderName()
  let result:SyncResult
  if(provider==='thesportsdb') {
    const fixtures=await fetchSportsDbFixtures(weekLabel)
    result={provider,written:await writeFixtures(fixtures.map(fixture=>({...fixture,matchDate:admin.firestore.Timestamp.fromDate(fixture.matchDate),source:'thesportsdb',updatedAt:admin.firestore.Timestamp.now()}))),failedLeagues:[]}
  } else {
    result=provider==='football-data'?await syncFootballDataFixtures(weekLabel):await syncApiFootballFixtures(weekLabel)
  }
  if(!result.written) throw new Error(`${result.provider} returned no fixtures`)
  return result
}

export async function fetchAndUpsertStandings(weekLabel:string):Promise<SyncResult> {
  const provider=footballProviderName()
  if(provider==='thesportsdb') {
    const standings=await fetchSportsDbStandings()
    await Promise.all(Object.entries(standings).map(([league,rows])=>adminDb.collection('standings').doc(`${league}-${weekLabel}`).set({league,weekLabel,rows,source:provider,updatedAt:admin.firestore.Timestamp.now()},{merge:true})))
    return {provider,written:Object.values(standings).reduce((total,rows)=>total+rows.length,0),failedLeagues:[]}
  }
  const leagues=Object.entries(LEAGUES).filter(([league])=>league!=='UCL'), season=seasonFor()
  const jobs=await Promise.allSettled(leagues.map(async ([league,ids])=>{
    let rows:any[]
    if(provider==='football-data') {
      const data=await jsonFetch(`${FOOTBALL_DATA_BASE}/competitions/${ids.footballData}/standings`,{'X-Auth-Token':process.env.FOOTBALL_DATA_API_KEY || ''})
      const table=data.standings?.find((s:any)=>s.type==='TOTAL')?.table || []
      rows=table.map((r:any)=>({rank:r.position,team:r.team.name,teamId:internalTeamId(r.team.name),pts:r.points,w:r.won,d:r.draw,l:r.lost,gd:`${r.goalDifference>0?'+':''}${r.goalDifference}`,form:''}))
    } else {
      const data=await jsonFetch(`${API_FOOTBALL_BASE}/standings?league=${ids.apiFootball}&season=${season}`,{'x-apisports-key':process.env.FOOTBALL_API_KEY || ''})
      const table=data.response?.[0]?.league?.standings?.[0] || []
      rows=table.map((r:any)=>({rank:r.rank,team:r.team.name,teamId:internalTeamId(r.team.name,r.team.id),pts:r.points,w:r.all.win,d:r.all.draw,l:r.all.lose,gd:`${r.goalsDiff>0?'+':''}${r.goalsDiff}`,form:r.form || ''}))
    }
    if(!rows.length) throw new Error(`${league} returned no standings`)
    await adminDb.collection('standings').doc(`${league}-${weekLabel}`).set({league,weekLabel,rows,source:provider,updatedAt:admin.firestore.Timestamp.now()},{merge:true})
    return rows.length
  }))
  const result={provider,written:jobs.reduce((n,j)=>n+(j.status==='fulfilled'?j.value:0),0),failedLeagues:jobs.flatMap((j,i)=>j.status==='rejected'?[leagues[i][0]]:[])}
  if(!result.written) throw new Error('Every standings league failed')
  return result
}

// Player rankings are an optional enhancement because the zero-key provider does not expose them.
export async function fetchAndUpsertPlayerStats(weekLabel: string): Promise<SyncResult> {
  if (!process.env.FOOTBALL_API_KEY) {
    return { provider: footballProviderName(), written: 0, failedLeagues: [] }
  }

  const season = seasonFor()
  const leagues = Object.entries(LEAGUES).filter(([league]) => league !== 'UCL')
  const jobs = await Promise.allSettled(leagues.map(async ([league, ids]) => {
    const headers = { 'x-apisports-key': process.env.FOOTBALL_API_KEY || '' }
    const [scorersData, assistsData] = await Promise.all([
      jsonFetch(`${API_FOOTBALL_BASE}/players/topscorers?league=${ids.apiFootball}&season=${season}`, headers),
      jsonFetch(`${API_FOOTBALL_BASE}/players/topassists?league=${ids.apiFootball}&season=${season}`, headers),
    ])
    const playerMap: Record<string, any> = {}

    for (const item of [...(scorersData.response || []), ...(assistsData.response || [])]) {
      const player = item.player
      const stat = item.statistics?.[0]
      if (!player || !stat) continue
      const teamId = internalTeamId(stat.team?.name || '', stat.team?.id)
      const key = `${teamId || stat.team?.id}-${player.id}`
      const existing = playerMap[key] || {}
      playerMap[key] = {
        ...existing,
        teamId,
        teamName: stat.team?.name || existing.teamName || '',
        playerName: player.name,
        position: stat.games?.position || existing.position || 'Unknown',
        goals: stat.goals?.total ?? existing.goals ?? 0,
        assists: stat.goals?.assists ?? existing.assists ?? 0,
        minutesPlayed: stat.games?.minutes ?? existing.minutesPlayed ?? 0,
        appearances: stat.games?.appearences ?? existing.appearances ?? 0,
        xg: stat.goals?.total ?? existing.xg ?? 0,
        chancesCreated: stat.passes?.key ?? existing.chancesCreated ?? 0,
        ballRetentionPct: Number(stat.passes?.accuracy ?? existing.ballRetentionPct ?? 0),
        isInjured: false,
        statWeek: weekLabel,
        league,
      }
    }

    await Promise.all(Object.entries(playerMap).map(([key, player]) =>
      adminDb.collection('playerStats').doc(`${key}-${weekLabel}`).set(player, { merge: true })
    ))
    return Object.keys(playerMap).length
  }))

  return {
    provider: 'api-football',
    written: jobs.reduce((total, job) => total + (job.status === 'fulfilled' ? job.value : 0), 0),
    failedLeagues: jobs.flatMap((job, index) => job.status === 'rejected' ? [leagues[index][0]] : []),
  }
}
