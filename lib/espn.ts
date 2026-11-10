import { COMPETITIONS, LEAGUE_ORDER, isWomen } from './competitions'
import { clubNameKey } from './club-names'
import { TEAMS_SEED } from './seed-data'
import type { Fixture, League, StandingRow, Team } from '@/types'

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const TABLE = 'https://site.api.espn.com/apis/v2/sports/soccer'
const LEGACY_ESPN_IDS: Record<string, string> = {
  360:'MUN', 359:'ARS', 382:'MCI', 364:'LFC', 363:'CFC', 367:'TOT', 361:'NEW',
  370:'FUL', 331:'BRI', 349:'BOU', 384:'CRY', 368:'EVE', 362:'AVL', 372:'WHU',
  83:'BAR', 86:'RMA', 1068:'ATM', 102:'VIL', 244:'RBB', 243:'SEV',
  132:'BMU', 124:'BVB', 131:'LEV', 11420:'RBL', 125:'SGE',
  110:'INT', 103:'ACM', 111:'JUV', 114:'NAP', 105:'ATA',
  160:'PSG', 174:'ASM', 176:'OLM', 166:'LIL', 432:'GAL', 2986:'BOG',
}
const seeds = new Map(TEAMS_SEED.map(team => [team.id, team]))
const seedsByName = new Map(TEAMS_SEED.map(team => [clubNameKey(team.name), team]))
const DAY = 86_400_000

type EspnTeam = {
  id: string
  displayName: string
  shortDisplayName?: string
  abbreviation?: string
  color?: string
  alternateColor?: string
  logo?: string
  logos?: Array<{ href: string }>
}

async function json(url: string, revalidate: number) {
  const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`)
  return response.json()
}

function badge(team: EspnTeam) {
  return team.logos?.[0]?.href || team.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${team.id}.png`
}

function teamFrom(team: EspnTeam, league: League): Team {
  const legacy = !isWomen(league) ? seedsByName.get(clubNameKey(team.displayName)) ?? seeds.get(LEGACY_ESPN_IDS[team.id]) : undefined
  return {
    id: legacy?.id ?? `espn-${team.id}`,
    espnId: team.id,
    name: team.displayName,
    shortName: team.shortDisplayName || legacy?.shortName || team.displayName,
    league,
    colorPrimary: team.color ? `#${team.color}` : legacy?.colorPrimary || '#333333',
    colorSecondary: team.alternateColor ? `#${team.alternateColor}` : legacy?.colorSecondary || '#ffffff',
    badgeUrl: badge(team),
    fallbackBadgeUrl: legacy?.badgeUrl,
    isUserSelected: legacy?.isUserSelected ?? false,
    tier: legacy?.tier ?? 'watch',
    isWildcard: legacy?.isWildcard ?? false,
  }
}

function dateKey(time: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(time)).replace(/-/g, '')
}

export async function fetchEspnFixtures(league: League, weekLabel: string) {
  const now = Date.now()
  // ESPN's soccer feed rejects date ranges. A daily URL also lets overlapping weeks share cached responses.
  const days = Array.from({ length: 16 }, (_, index) => dateKey(now + (index - 7) * DAY))
  const base = `${SITE}/${COMPETITIONS[league].espn}/scoreboard`
  const daily = await Promise.allSettled(days.map(async (date, index) => {
    const data = await json(`${base}?dates=${date}`, index === 7 ? 300 : 1800)
    if (!Array.isArray(data.events)) throw new Error('ESPN fixture feed has no events array')
    return data
  }))
  const feeds = daily.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  if (!feeds.length) throw new Error('All ESPN schedule dates failed')
  const competition = feeds.find(feed => feed.leagues?.[0]?.name)?.leagues[0].name || league
  const events = new Map<string, any>(feeds.flatMap(feed => feed.events).map(event => [event.id, event]))
  const clubs = new Map<string, Team>()
  const fixtures: Fixture[] = []
  for (const event of events.values()) {
    const match = event.competitions?.[0]
    const status = match?.status?.type || event.status?.type
    const home = match?.competitors?.find((entry: any) => entry.homeAway === 'home')
    const away = match?.competitors?.find((entry: any) => entry.homeAway === 'away')
    const matchDate = new Date(event.date)
    if (!home?.team?.id || !away?.team?.id || !Number.isFinite(+matchDate) ||
        !['pre', 'in', 'post'].includes(status?.state) ||
        /CANCEL|POSTPON|SUSPEND|ABANDON|DELAY|TBD|FORFEIT/i.test(status.name || '')) continue
    const h = teamFrom(home.team, league)
    const a = teamFrom(away.team, league)
    clubs.set(h.id, h)
    clubs.set(a.id, a)
    const score = (value: unknown) => /^\d+$/.test(String(value)) ? Number(value) : undefined
    const goalDetails = (match.details ?? []).filter((item: any) => item.scoringPlay && !item.shootout)
    const goals = goalDetails.flatMap((item: any) => {
      const team = String(item.team?.id) === h.espnId ? h : String(item.team?.id) === a.espnId ? a : null
      const player = item.athletesInvolved?.[0]?.displayName || item.athletesInvolved?.[0]?.fullName
      const clock = item.clock?.displayValue
      return team && player && clock && Number.isFinite(item.clock?.value)
        ? [{ teamId: team.id, player, clock, seconds: item.clock.value }] : []
    }).sort((a: any, b: any) => a.seconds - b.seconds)
    const recap = match.headlines?.find((item: any) => item.shortLinkText || item.description)
    fixtures.push({
      id: `espn-${event.id}`, homeTeamId: h.id, awayTeamId: a.id, homeName: h.name, awayName: a.name,
      homeColorPrimary: h.colorPrimary, homeColorSecondary: h.colorSecondary,
      awayColorPrimary: a.colorPrimary, awayColorSecondary: a.colorSecondary,
      homeBadgeUrl: h.badgeUrl, awayBadgeUrl: a.badgeUrl,
      competition, league, matchDate,
      status: status.completed ? 'final' : status.state === 'in' ? 'live' : 'scheduled',
      homeScore: status.state !== 'pre' ? score(home.score) : undefined,
      awayScore: status.state !== 'pre' ? score(away.score) : undefined,
      round: match.series?.title || match.notes?.[0]?.headline,
      recap: recap?.shortLinkText || recap?.description,
      goals,
      sourceUrl: `https://www.espn.com/soccer/match/_/gameId/${event.id}`,
      tier: 'watch', winProbHome: 0, winProbAway: 0, winProbDraw: 0, preview: '',
      refereeName: '', refereeNote: '', isDerby: false, isPinned: false, weekLabel,
    })
  }
  return { fixtures, teams: [...clubs.values()], partial: feeds.length < days.length }
}

export async function fetchEspnTable(league: League) {
  const data = await json(`${TABLE}/${COMPETITIONS[league].espn}/standings`, 1800)
  const entries = data.standings?.entries ?? data.children?.flatMap((child: any) => child.standings?.entries ?? []) ?? []
  const rows = new Map<string, StandingRow>()
  const clubs = new Map<string, Team>()
  for (const entry of entries) {
    if (!entry.team?.id) continue
    const team = teamFrom(entry.team, league)
    const stat = (name: string) => entry.stats?.find((item: any) => item.name === name)
    const rank = Number(stat('rank')?.value) || rows.size + 1
    if (!['points', 'wins', 'ties', 'losses', 'pointDifferential'].every(name => Number.isFinite(stat(name)?.value))) continue
    clubs.set(team.id, team)
    rows.set(team.id, {
      rank, teamId: team.id, team: team.name, badgeUrl: team.badgeUrl, fallbackBadgeUrl: team.fallbackBadgeUrl,
      pts: stat('points').value, w: stat('wins').value, d: stat('ties').value, l: stat('losses').value,
      gd: stat('pointDifferential').displayValue ?? String(stat('pointDifferential').value),
      form: '', isUserClub: false, isTopFour: entry.note?.description === 'Champions League',
      isRelegation: entry.note?.description === 'Relegation', isWatch: false,
    })
  }
  return { rows: [...rows.values()].sort((a, b) => a.rank - b.rank), teams: [...clubs.values()] }
}

export async function fetchEspnDashboard(weekLabel: string) {
  const results = await Promise.all(LEAGUE_ORDER.map(async league => {
    const [schedule, table] = await Promise.allSettled([fetchEspnFixtures(league, weekLabel), fetchEspnTable(league)])
    if (schedule.status === 'rejected') console.warn(`[fixtures] ${league}`, schedule.reason?.message)
    if (table.status === 'rejected') console.warn(`[table] ${league}`, table.reason?.message)
    return { league, schedule: schedule.status === 'fulfilled' ? schedule.value : null,
      table: table.status === 'fulfilled' ? table.value : null }
  }))
  const teams = new Map(TEAMS_SEED.map(team => [team.id, team]))
  // Domestic membership takes precedence when a club appears in the Champions League too.
  const domesticFirst = [...results].sort((a, b) =>
    Number(['UCL', 'UWCL'].includes(b.league)) - Number(['UCL', 'UWCL'].includes(a.league)))
  for (const result of domesticFirst) {
    for (const team of [...(result.schedule?.teams ?? []), ...(result.table?.teams ?? [])]) teams.set(team.id, team)
  }
  const fixtures = results.flatMap(result => result.schedule?.fixtures ?? []).sort((a, b) => +a.matchDate - +b.matchDate)
  const standings = Object.fromEntries(results.map(({ league, table }) => [league, (table?.rows ?? []).map(row => {
    const form = fixtures.filter(f => f.league === league && f.status === 'final' && f.homeScore != null && f.awayScore != null &&
      [f.homeTeamId, f.awayTeamId].includes(row.teamId)).slice(-5).map(f => {
      const difference = (f.homeScore! - f.awayScore!) * (f.homeTeamId === row.teamId ? 1 : -1)
      return difference > 0 ? 'W' : difference < 0 ? 'L' : 'D'
    }).join('')
    return { ...row, form }
  })]))
  return {
    teams: [...teams.values()],
    fixtures, standings,
    unavailableSchedules: results.filter(result => !result.schedule || result.schedule.partial).map(result => result.league),
  }
}
