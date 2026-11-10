import type { League } from '@/types'

export const COMPETITIONS = {
  EPL: { espn: 'eng.1', teams: 20, sofa: 17 },
  LA_LIGA: { espn: 'esp.1', teams: 20, sofa: 8 },
  BUNDESLIGA: { espn: 'ger.1', teams: 18, sofa: 35 },
  SERIE_A: { espn: 'ita.1', teams: 20, sofa: 23 },
  LIGUE_1: { espn: 'fra.1', teams: 18, sofa: 34 },
  UCL: { espn: 'uefa.champions', teams: 36, sofa: 7 },
  WSL: { espn: 'eng.w.1', teams: 14, sofa: 1044 },
  LIGA_F: { espn: 'esp.w.1', teams: 16, sofa: 1127 },
  UWCL: { espn: 'uefa.wchampions', teams: 18, sofa: 696 },
} as const

export const LEAGUE_ORDER = Object.keys(COMPETITIONS) as League[]
export const isWomen = (league: string) => ['WSL', 'LIGA_F', 'UWCL'].includes(league)
export const isEuropeanCup = (league: string) => league === 'UCL' || league === 'UWCL'
export const isLeague = (league: string): league is League => Object.hasOwn(COMPETITIONS, league)
