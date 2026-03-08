export type League = 'EPL' | 'LA_LIGA' | 'BUNDESLIGA' | 'SERIE_A' | 'LIGUE_1' | 'UCL'

export interface LeagueTheme {
  name: string
  primary: string
  accent: string
  textColor: string
  badge: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  league: League
  colorPrimary: string
  colorSecondary: string
  badgeUrl: string
  isUserSelected: boolean
  tier: 'priority' | 'watch' | 'underdog'
  isWildcard: boolean
}

export interface Fixture {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeName: string
  awayName: string
  homeColorPrimary: string
  homeColorSecondary: string
  awayColorPrimary: string
  awayColorSecondary: string
  competition: string
  league: string
  matchDate: Date
  status: 'scheduled' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
  tier: 'unmissable' | 'priority' | 'watch'
  winProbHome: number
  winProbAway: number
  winProbDraw: number
  preview: string
  refereeName: string
  refereeNote: string
  isDerby: boolean
  isPinned: boolean
  weekLabel: string
}

export interface Story {
  id: string
  teamId: string
  league: string
  tag: string
  title: string
  druryQuote: string
  body: string
  statsJson: string[]
  weekLabel: string
  isActive: boolean
}

export interface PlayerStat {
  teamId: string
  playerName: string
  position: string
  goals: number
  assists: number
  xg: number
  chancesCreated: number
  ballRetentionPct: number
  minutesPlayed: number
  appearances: number
  isInjured: boolean
  injuryNote?: string
  scoutingNote?: string
  statWeek: string
}

export interface PinnedFixture {
  label: string
  date: string
  color: string
}

export interface HistoryFact {
  date: string
  fact: string
}

export interface WeeklyDigest {
  weekLabel: string
  wildcardTeamId: string
  wildcardReason: string
  historyFacts: HistoryFact[]
  humorItems: string[]
  pinnedFixtures: PinnedFixture[]
}

export interface StandingRow {
  rank: number
  team: string
  teamId: string
  pts: number
  w: number
  d: number
  l: number
  gd: string
  form: string
  isUserClub: boolean
  isTopFour: boolean
  isRelegation: boolean
  isWatch: boolean
}

export interface YoutubeVideo {
  videoId: string
  title: string
  thumbnail: string
  publishedAt: string
}
