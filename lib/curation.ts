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

export function curateFixtures(fixtures: Fixture[], standings: Record<string, StandingRow[]>, selected: string[], now = Date.now()) {
  const following = new Set(selected)
  return fixtures.flatMap(fixture => {
    const hours = (+fixture.matchDate - now) / 3_600_000
    if (fixture.status === 'final' || hours > 168 || (fixture.status === 'scheduled' && hours < 0) ||
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

export function footballHumor(fixtures: Fixture[], selected: string[], now = Date.now()) {
  const kinds = new Set<string>()
  const lines: string[] = []
  const finals = fixtures.filter(f => f.status === 'final' && f.homeScore != null && f.awayScore != null &&
    +f.matchDate <= now && +f.matchDate >= now - 7 * 86_400_000)
    .sort((a, b) => Number([b.homeTeamId, b.awayTeamId].some(id => selected.includes(id))) -
      Number([a.homeTeamId, a.awayTeamId].some(id => selected.includes(id))) || +b.matchDate - +a.matchDate)
  for (const f of finals) {
    const home = f.homeScore!
    const away = f.awayScore!
    const winner = home > away ? f.homeName : f.awayName
    const loser = home > away ? f.awayName : f.homeName
    let kind = ''
    let line = ''
    const lastGoal = f.goals?.at(-1)
    if (lastGoal && f.goals?.length === home + away && Math.abs(home - away) === 1 && lastGoal.seconds >= 89 * 60 &&
        lastGoal.teamId === (home > away ? f.homeTeamId : f.awayTeamId)) {
      kind = 'late'
      line = `${lastGoal.player}, ${lastGoal.clock}. ${loser} got as far as the group chat’s “we’ll take a point” message before ${winner} made them delete it.`
    } else if (home === away && home >= 3) {
      kind = 'shootout'
      line = `${f.homeName} and ${f.awayName} traded ${home} goals each and still split the points. That's a whole group-stage goal difference spent on a handshake.`
      if (isEuropeanCup(f.league)) line = `${f.homeName} and ${f.awayName} traded ${home} goals each. The highlights editor is asking for extra time.`
    } else if (Math.abs(home - away) >= 3) {
      kind = 'rout'
      line = `${winner} won by ${Math.abs(home - away)}. ${loser} could probably file the replay under opposition scouting and skip their own clips.`
    } else if (home + away >= 5 && Math.abs(home - away) === 1) {
      kind = 'one-more'
      line = `${loser} scored ${Math.min(home, away)} and still needed another. ${winner} evidently decided the clean-sheet bonus could wait.`
    } else if (home === 0 && away === 0) {
      kind = 'blank'
      line = `The ${f.homeName}–${f.awayName} score graphic had one job and clocked out with exactly what it started with.`
    }
    if (line && !kinds.has(kind)) {
      kinds.add(kind)
      lines.push(`${scoreline(f)} — ${line}`)
    }
    if (lines.length >= 4) break
  }
  return lines
}
