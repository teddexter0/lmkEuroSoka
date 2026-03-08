import type { LeagueTheme } from '@/types'

export const LEAGUE_THEMES: Record<string, LeagueTheme> = {
  EPL:        { name: 'Premier League',    primary: '#3D195B', accent: '#00FF85', textColor: '#E8F5E9', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  LA_LIGA:    { name: 'La Liga',           primary: '#EE1111', accent: '#FFCC00', textColor: '#FFF8E1', badge: '🇪🇸' },
  BUNDESLIGA: { name: 'Bundesliga',        primary: '#D20515', accent: '#FFFFFF', textColor: '#FFFFFF', badge: '🇩🇪' },
  SERIE_A:    { name: 'Serie A',           primary: '#1B3F8B', accent: '#009246', textColor: '#E3F0FF', badge: '🇮🇹' },
  LIGUE_1:    { name: 'Ligue 1',          primary: '#16213E', accent: '#00A9E0', textColor: '#E0F4FF', badge: '🇫🇷' },
  UCL:        { name: 'Champions League',  primary: '#0A1628', accent: '#F5C842', textColor: '#FFFDE7', badge: '⭐' },
}

export function getWeekLabel(date = new Date()): string {
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  return `${months[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`
}

export function currentWeekLabel(): string {
  return getWeekLabel(new Date())
}

export function daysUntil(date: Date): string {
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  return `in ${diff}d`
}

export function toEAT(date: Date): string {
  return date.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function tierColor(tier: string): string {
  if (tier === 'unmissable') return '#FF4500'
  if (tier === 'priority') return '#FFD700'
  return '#00BFFF'
}

export function tierLabel(tier: string): string {
  if (tier === 'unmissable') return '🔥 UNMISSABLE'
  if (tier === 'priority') return '⭐ PRIORITY'
  return '👁 WATCH'
}
