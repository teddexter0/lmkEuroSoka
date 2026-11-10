import type { League } from '@/types'

export const COMPETITIONS = {
  EPL: { espn: 'eng.1', teams: 20 },
  LA_LIGA: { espn: 'esp.1', teams: 20 },
  BUNDESLIGA: { espn: 'ger.1', teams: 18 },
  SERIE_A: { espn: 'ita.1', teams: 20 },
  LIGUE_1: { espn: 'fra.1', teams: 18 },
  UCL: { espn: 'uefa.champions', teams: 36 },
  WSL: { espn: 'eng.w.1', teams: 14 },
  LIGA_F: { espn: 'esp.w.1', teams: 16 },
  UWCL: { espn: 'uefa.wchampions', teams: 18 },
} as const

export const LEAGUE_ORDER = Object.keys(COMPETITIONS) as League[]
export const isWomen = (league: string) => ['WSL', 'LIGA_F', 'UWCL'].includes(league)
export const isEuropeanCup = (league: string) => league === 'UCL' || league === 'UWCL'
export const isLeague = (league: string): league is League => Object.hasOwn(COMPETITIONS, league)
