import { NextRequest, NextResponse } from 'next/server'
import { isLeague, isWomen } from '@/lib/competitions'
import { fetchTeamNews } from '@/lib/news'
import { getLiveDashboard } from '@/lib/live-dashboard'
import { currentWeekLabel, toEAT } from '@/lib/utils'
import { decidingGoal, scoreline } from '@/lib/curation'
import type { Story } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function signalFor(title: string) {
  if (/\b(injur|ruled out|injury doubt|suspend|fitness|back in training|returns to training|unavailable)/i.test(title)) return 'Availability'
  if (/\b(transfer|bid|signing|signs|loan|contract|medical|agrees terms|target)\b/i.test(title)) return 'Transfer desk'
  if (/\b(lineup|line.up|tactics|formation|squad|selection)\b/i.test(title)) return 'Team selection'
  if (/\b(protest|ownership|owner|takeover|sack|resign|appointment)\b/i.test(title)) return 'Club watch'
  if (/\b(analysis|tactical|talking points|ratings|reaction|what we learned)\b/i.test(title)) return 'Match fallout'
  return ''
}

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get('league') ?? ''
  const id = request.nextUrl.searchParams.get('club') ?? ''
  if (!isLeague(league) || !/^[a-z0-9-]{2,24}$/i.test(id)) return NextResponse.json({ error: 'Unknown club or competition' }, { status: 400 })
  const weekLabel = currentWeekLabel()
  const data = await getLiveDashboard(weekLabel)
  const team = data.teams.find(club => club.id === id)
  const inCompetition = data.standings[league]?.some(row => row.teamId === id) ||
    data.fixtures.some(f => f.league === league && [f.homeTeamId, f.awayTeamId].includes(id))
  if (!team || (team.league !== league && !inCompetition)) return NextResponse.json({ error: 'Club is outside this competition' }, { status: 404 })
  const related = data.fixtures.filter(f => [f.homeTeamId, f.awayTeamId].includes(id)).map(f => ({ ...f, matchDate: new Date(f.matchDate) }))
  const latest = related.filter(f => f.status === 'final' && f.homeScore != null && f.awayScore != null).at(-1)
  const next = related.find(f => f.status === 'scheduled' && +f.matchDate >= Date.now())
  const row = data.standings[league]?.find(entry => entry.teamId === id)
  const articles = await fetchTeamNews(team.name, 25, isWomen(league)).catch(() => [])
  const signals: NonNullable<Story['signals']> = []
  for (const article of articles) {
    const label = signalFor(article.title)
    if (!label || signals.some(signal => signal.label === label) || /how to watch|live stream|ticket|betting|odds|highlights/i.test(article.title)) continue
    signals.push({ label, title: article.title, url: article.url, source: article.source, publishedAt: article.publishedAt })
    if (signals.length === 4) break
  }
  const won = latest && (latest.homeTeamId === id ? latest.homeScore! > latest.awayScore! : latest.awayScore! > latest.homeScore!)
  const outcome = latest && (latest.homeScore === latest.awayScore ? 'draw' : won ? 'win' : 'defeat')
  const previous = related.filter(f => f.status === 'final' && f.homeScore != null && f.awayScore != null).slice(-3)
  const form = previous.map(f => {
    const [scored, conceded] = f.homeTeamId === id ? [f.homeScore!, f.awayScore!] : [f.awayScore!, f.homeScore!]
    return scored === conceded ? 'D' : scored > conceded ? 'W' : 'L'
  }).join(' · ')
  const placement = row ? `#${row.rank} in this competition with ${row.pts} points from ${row.w + row.d + row.l} matches.` : ''
  const title = latest ? latest.recap || `${scoreline(latest)} · ${outcome}` : next ? `${next.homeName} vs ${next.awayName}` : `${team.name} club desk`
  const decisive = latest && decidingGoal(latest)
  const above = row && data.standings[league]?.find(entry => entry.rank === row.rank - 1)
  const tableContext = row && above && above.pts > row.pts
    ? `${team.name} sit ${above.pts - row.pts} point${above.pts - row.pts === 1 ? '' : 's'} behind ${above.team}, the club immediately above them.`
    : row && above && above.pts === row.pts ? `${team.name} are level on points with ${above.team}, one place above.` : ''
  const fixtureContext = next && next.league === league && row
    ? data.standings[league]?.find(entry => entry.teamId === (next.homeTeamId === id ? next.awayTeamId : next.homeTeamId))
    : undefined
  const goalNote = decisive && decisive.seconds >= 80 * 60
    ? `Decisive moment · ${decisive.player} ${decisive.after === 0 ? 'equalised' : 'scored the winner'} at ${decisive.clock}.` : ''
  const body = [
    latest && `Last match · ${scoreline(latest)} in ${latest.competition}. ${placement}`.trim(),
    goalNote,
    !latest && placement,
    tableContext,
    next && `Next test · ${next.homeName} vs ${next.awayName} in ${next.competition}, ${toEAT(next.matchDate)} EAT.${fixtureContext ? ` ${fixtureContext.team} are #${fixtureContext.rank} on ${fixtureContext.pts} points.` : ''}`,
  ].filter(Boolean).join('\n\n')
  const matchSources = [...previous.reverse(), next].flatMap(f => f?.sourceUrl
    ? [{ source: 'ESPN', title: f.status === 'final' ? scoreline(f) : `${f.homeName} vs ${f.awayName}`, url: f.sourceUrl, publishedAt: '' }]
    : [])
  return NextResponse.json({
    id: `${league}-${id}-${weekLabel}`, teamId: id, league, tag: team.name,
    title, druryQuote: '', body, signals, statsJson: form ? [`Recent form ${form}`] : [], sources: matchSources, weekLabel, isActive: true,
  } satisfies Story)
}
