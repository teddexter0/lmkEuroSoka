import { unstable_cache } from 'next/cache'
import { COMPETITIONS } from './competitions'
import type { League } from '@/types'

const FIELDS = [
  'goals', 'assists', 'minutesPlayed', 'appearances', 'started', 'yellowCards', 'redCards',
  'fouls', 'expectedGoals', 'keyPasses', 'tackles', 'interceptions', 'cleanSheets', 'saves',
] as const
export type PlayerMetric = typeof FIELDS[number]
export type SeasonPlayer = {
  id: string
  name: string
  club: string
  position: string
  metrics: Partial<Record<PlayerMetric, number>>
}

async function sofa(path: string) {
  const response = await fetch(`https://www.sofascore.com/api/v1/${path}`, { signal: AbortSignal.timeout(5500) })
  if (!response.ok) throw new Error(`Sofascore returned ${response.status}`)
  return response.json()
}

export const getSeasonPlayers = unstable_cache(async (league: League, startYear: number) => {
  const base = `unique-tournament/${COMPETITIONS[league].sofa}`
  const data = await sofa(`${base}/seasons`)
  const year = String(startYear).slice(-2)
  const end = String(startYear + 1).slice(-2)
  const season = data.seasons?.find((item: any) =>
    [`${year}/${end}`, `${startYear}/${end}`, `${startYear}/${startYear + 1}`].includes(String(item.year)))
  if (!season?.id) throw new Error('Current season is missing from the player feed')
  const path = `${base}/season/${season.id}/statistics?limit=100&order=-minutesPlayed&accumulation=total&fields=${FIELDS.join(',')}`
  const first = await sofa(`${path}&offset=0`)
  if (!Array.isArray(first.results)) throw new Error('Player feed returned an unexpected response')
  const pageCount = Number(first.pages ?? 1)
  if (!Number.isInteger(pageCount) || pageCount < 0 || pageCount > 15) throw new Error('Invalid player feed pagination')
  const pages = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) =>
    sofa(`${path}&offset=${(i + 1) * 100}`)))
  const players = new Map<string, SeasonPlayer>()
  for (const page of [first, ...pages]) {
    if (!Array.isArray(page.results)) throw new Error('A player stats page is missing')
    for (const row of page.results) {
      if (!row.player?.id || !row.player.name || !row.team?.name) continue
      const id = `${row.team.id}-${row.player.id}`
      const metrics = Object.fromEntries(FIELDS.flatMap(field => {
        const value = row[field] ?? row.statistics?.[field]
        return typeof value === 'number' && Number.isFinite(value) ? [[field, value]] : []
      }))
      if (Object.keys(metrics).length) {
        players.set(id, { id, name: row.player.name, club: row.team.name, position: row.player.position || '', metrics })
      }
    }
  }
  return { players: [...players.values()], season: `${startYear}/${end}`,
    sourceUrl: `https://www.sofascore.com/football/tournament/${COMPETITIONS[league].sofa}` }
}, ['season-players-v1'], { revalidate: 21_600 })
