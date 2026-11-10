import { isEuropeanCup, isWomen } from './competitions'
import { toEAT } from './utils'
import type { Fixture, StandingRow } from '@/types'

const DERBIES = [
  ['MUN','MCI','Manchester derby'], ['MUN','LFC','North West rivalry'],
  ['ARS','TOT','North London derby'], ['LFC','EVE','Merseyside derby'],
  ['BAR','RMA','El Clásico'], ['RMA','ATM','Madrid derby'],
  ['BMU','BVB','Der Klassiker'], ['INT','ACM','Milan derby'],
  ['INT','JUV','Derby d’Italia'], ['PSG','OLM','Le Classique'],
]

export function curateFixtures(fixtures: Fixture[], standings: Record<string, StandingRow[]>, selected: string[], now = Date.now(), days = 7) {
  const following = new Set(selected)
  return fixtures.flatMap(fixture => {
    const hours = (+fixture.matchDate - now) / 3_600_000
    if (fixture.status === 'final' || hours > days * 24 || (fixture.status === 'scheduled' && hours < 0) ||
        (fixture.status === 'live' && hours < -4)) return []
    const ids = [fixture.homeTeamId, fixture.awayTeamId]
    const followed = ids.filter(id => following.has(id)).length
    const derby = DERBIES.find(([home, away]) => ids.includes(home) && ids.includes(away))
    const cup = isEuropeanCup(fixture.league)
    const knockout = cup && /knockout|round of|quarter.?final|semi.?final|\bfinal\b|play.?off/i.test(fixture.round || '')
    const top = (standings[fixture.league] || []).filter(row =>
      ids.includes(row.teamId) && row.rank <= 4 && row.w + row.d + row.l >= 5)
    const tight = top.length === 2 && Math.abs(top[0].pts - top[1].pts) <= 6
    const table = standings[fixture.league] || []
    const matchup = table.filter(row => ids.includes(row.teamId))
    const womenSpotlight = isWomen(fixture.league) && matchup.length === 2 &&
      (cup ? matchup.every(row => row.rank <= 8) : matchup.every(row => row.rank <= 6) && matchup.some(row => row.rank <= 2))
    if (!followed && !derby && !tight && !knockout && !womenSpotlight) return []
    const reasons = [
      followed === 2 ? 'Two clubs you follow' : followed === 1 ? 'Club you follow' : '',
      derby?.[2], knockout ? (fixture.round || 'Champions League knockout') : cup ? fixture.competition : '',
      tight ? `#${top[0].rank} vs #${top[1].rank} · ${Math.abs(top[0].pts - top[1].pts)} pts apart` :
        womenSpotlight ? `Women’s spotlight · #${matchup[0].rank} vs #${matchup[1].rank}` : '',
    ].filter(Boolean)
    const score = followed * 4 + (derby ? 5 : 0) + (knockout ? 5 : cup ? 2 : 0) + (tight ? 4 : womenSpotlight ? 3 : 0)
    const tier: Fixture['tier'] = score >= 9 ? 'unmissable' : score >= 5 ? 'priority' : 'watch'
    return [{ score, fixture: { ...fixture, tier, isDerby: !!derby, watchReason: reasons.join(' · ') } }]
  }).sort((a,b) => b.score - a.score || +a.fixture.matchDate - +b.fixture.matchDate).map(item => item.fixture)
}

export function fixtureShortlist(fixtures: Fixture[]) {
  const group = (women: boolean, limit: number) => {
    const chosen: Fixture[] = []
    const leagues = new Set<string>()
    const matches = fixtures.filter(fixture => isWomen(fixture.league) === women)
    for (const fixture of matches) {
      if (leagues.has(fixture.league)) continue
      leagues.add(fixture.league)
      chosen.push(fixture)
      if (chosen.length === limit) return chosen
    }
    return [...chosen, ...matches.filter(fixture => !chosen.includes(fixture))].slice(0, limit)
  }
  return { men: group(false, 5), women: group(true, 3) }
}

export function scoreline(fixture: Fixture) {
  return `${fixture.homeName} ${fixture.homeScore}–${fixture.awayScore} ${fixture.awayName}`
}

export function fixturePins(fixtures: Fixture[]) {
  return fixtures.map(fixture => ({
    label: `${fixture.homeName} vs ${fixture.awayName}`,
    date: toEAT(fixture.matchDate),
    color: isWomen(fixture.league) ? '#ff9bde' : '#FFD700',
    reason: fixture.watchReason,
    sourceUrl: fixture.sourceUrl,
  }))
}

function goalTimeline(fixture: Fixture) {
  if (fixture.status !== 'final' || fixture.homeScore == null || fixture.awayScore == null) return []
  let home = 0
  let away = 0
  const timeline = (fixture.goals ?? []).flatMap(goal => {
    const before = home - away
    if (goal.teamId === fixture.homeTeamId) home++
    else if (goal.teamId === fixture.awayTeamId) away++
    else return []
    return [{ ...goal, before, after: home - away, home, away }]
  })
  return home === fixture.homeScore && away === fixture.awayScore ? timeline : []
}

export function decidingGoal(fixture: Fixture) {
  const finalOutcome = Math.sign((fixture.homeScore ?? 0) - (fixture.awayScore ?? 0))
  return goalTimeline(fixture).filter(goal =>
    Math.sign(goal.before) !== finalOutcome && Math.sign(goal.after) === finalOutcome).at(-1)
}

export function footballHumor(fixtures: Fixture[], selected: string[], now = Date.now()) {
  const finals = fixtures.filter(match => match.status === 'final' &&
    +match.matchDate <= now && +match.matchDate >= now - 7 * 86_400_000)
    .sort((a, b) => Number([b.homeTeamId, b.awayTeamId].some(id => selected.includes(id))) -
      Number([a.homeTeamId, a.awayTeamId].some(id => selected.includes(id))) || +b.matchDate - +a.matchDate)
  const lines: string[] = []
  for (const match of finals) {
    const timeline = goalTimeline(match)
    if (!timeline.length) continue
    const deciding = decidingGoal(match)
    const homeBehindTwice = timeline.filter(goal => goal.after === -2 && goal.before === -1).length >= 2
    const awayBehindTwice = timeline.filter(goal => goal.after === 2 && goal.before === 1).length >= 2
    const team = homeBehindTwice ? match.homeName : match.awayName
    if (match.homeScore === match.awayScore && (homeBehindTwice || awayBehindTwice)) {
      lines.push(`${scoreline(match)} · ${team} went two down, got back into it, then went two down again. Apparently the first comeback was a rehearsal.`)
    } else if (deciding && deciding.seconds >= 89 * 60 && deciding.after !== 0) {
      lines.push(`${scoreline(match)} · ${deciding.player} made it ${deciding.home}–${deciding.away} at ${deciding.clock}. Anyone who left to beat traffic got a different result.`)
    } else if (deciding && deciding.seconds >= 89 * 60 && deciding.after === 0) {
      lines.push(`${scoreline(match)} · ${deciding.player} equalised at ${deciding.clock}. The post-match victory draft can go back in drafts.`)
    }
    if (lines.length >= 4) break
  }
  return lines
}
