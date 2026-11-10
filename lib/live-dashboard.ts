import { unstable_cache } from 'next/cache'
import { COMPETITIONS, isLeague } from './competitions'
import { fetchEspnDashboard } from './espn'
import { fetchSportsDbStandings } from './sportsdb'

export const getLiveDashboard = unstable_cache(async (weekLabel: string) => {
  const data = await fetchEspnDashboard(weekLabel)
  const needsFallback = Object.entries(data.standings).some(([league, rows]) =>
    isLeague(league) && COMPETITIONS[league].teams > 0 && rows.length < COMPETITIONS[league].teams)
  if (needsFallback) {
    const fallback = await fetchSportsDbStandings()
    for (const [league, rows] of Object.entries(fallback)) {
      if (isLeague(league) && rows.length === COMPETITIONS[league].teams && rows.length > data.standings[league].length) {
        data.standings[league] = rows
      }
    }
  }
  return {
    ...data, stories: [], digest: null, prevWeeks: [weekLabel], stats: [], selectedTeams: [],
    refresh: { success: data.fixtures.length > 0 || Object.values(data.standings).some(rows => rows.length > 0),
      provider: 'ESPN / TheSportsDB standings fallback', completedAt: new Date().toISOString() },
  }
}, ['live-dashboard-v4'], { revalidate: 900, tags: ['live-dashboard'] })
