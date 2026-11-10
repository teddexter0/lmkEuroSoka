import { unstable_cache } from 'next/cache'
import { COMPETITIONS } from './competitions'
import { fetchEspnTable } from './espn'
import type { League } from '@/types'

const METRICS = {
  totalGoals: 'goals', goalAssists: 'assists', minutes: 'minutesPlayed',
  appearances: 'appearances', starts: 'started', yellowCards: 'yellowCards',
  redCards: 'redCards', foulsCommitted: 'fouls', shotAssists: 'keyPasses',
  totalTackles: 'tackles', interceptions: 'interceptions', cleanSheet: 'cleanSheets',
  saves: 'saves', totalShots: 'shots', shotsOnTarget: 'shotsOnTarget',
} as const

export type PlayerMetric = typeof METRICS[keyof typeof METRICS]
export type SeasonPlayer = {
  id: string
  clubId: string
  name: string
  club: string
  position: string
  metrics: Partial<Record<PlayerMetric, number>>
}

type EspnStat = { name: string; value?: number }
type Splits = { categories?: Array<{ stats?: EspnStat[] }> }
type Athlete = {
  id: string
  displayName: string
  position?: { abbreviation?: string }
  statistics?: { splits?: Splits }
}

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const CORE = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues'
const CACHE_SECONDS = 3600

async function espnStats(url: string) {
  const response = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(5500) })
  if (!response.ok) throw new Error(`ESPN player feed returned ${response.status}`)
  return response.json()
}

function metricsFrom(splits?: Splits): SeasonPlayer['metrics'] {
  const result: SeasonPlayer['metrics'] = {}
  for (const category of splits?.categories ?? []) {
    for (const stat of category.stats ?? []) {
      const field = METRICS[stat.name as keyof typeof METRICS]
      if (field && typeof stat.value === 'number' && Number.isFinite(stat.value)) result[field] = stat.value
    }
  }
  return result
}

const getClubPlayers = unstable_cache(async (league: League, year: number, clubId: string, detailed: boolean) => {
  const competition = COMPETITIONS[league].espn
  const roster = await espnStats(`${SITE}/${competition}/teams/${clubId}/roster?season=${year}`)
  if (String(roster.team?.id) !== clubId || roster.season?.year !== year || !Array.isArray(roster.athletes)) {
    throw new Error('ESPN roster did not match the requested club and season')
  }

  const players: SeasonPlayer[] = (roster.athletes as Athlete[]).flatMap(athlete => {
    const metrics = metricsFrom(athlete.statistics?.splits)
    if (!athlete.id || !athlete.displayName || !Object.keys(metrics).length) return []
    return [{
      id: String(athlete.id), clubId, club: roster.team.displayName, name: athlete.displayName,
      position: athlete.position?.abbreviation ?? '', metrics,
    }]
  })
  if (!detailed) return players

  const results = await Promise.allSettled(players.filter(player => (player.metrics.appearances ?? 0) > 0).map(async player => {
    const totals = await espnStats(`${CORE}/${competition}/seasons/${year}/types/1/teams/${clubId}/athletes/${player.id}/statistics`)
    const extra = metricsFrom(totals.splits)
    // A player can have different totals across clubs or stages. Keep the roster figures authoritative.
    const sameSample = (['appearances', 'goals', 'assists'] as const).every(metric =>
      player.metrics[metric] === undefined || extra[metric] === player.metrics[metric])
    if (sameSample) player.metrics = { ...extra, ...player.metrics }
  }))
  const failed = results.filter(result => result.status === 'rejected').length
  if (failed) console.warn(`[player-stats] ${league}/${clubId} detailed feed unavailable for ${failed} players`)
  return players
}, ['espn-club-player-totals-v1'], { revalidate: CACHE_SECONDS })

export async function getSeasonPlayers(league: League, year: number, clubId?: string) {
  const ids = clubId ? [clubId] : (await fetchEspnTable(league)).teams.flatMap(team => team.espnId ? [team.espnId] : [])
  const clubs = await Promise.allSettled(ids.map(id => getClubPlayers(league, year, id, Boolean(clubId))))
  const players = clubs.flatMap(result => result.status === 'fulfilled' ? result.value : [])
  if (!players.length && (!ids.length || clubs.every(result => result.status === 'rejected'))) {
    throw new Error('No ESPN club player feeds were available')
  }
  return {
    players, season: `${year}/${String(year + 1).slice(-2)}`, source: 'ESPN',
    sourceUrl: clubId ? `https://www.espn.com/soccer/team/stats/_/id/${clubId}/league/${COMPETITIONS[league].espn}`
      : `https://www.espn.com/soccer/stats/_/league/${COMPETITIONS[league].espn}`,
  }
}
