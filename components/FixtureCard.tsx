'use client'

import type { Fixture } from '@/types'
import ClubBadge from './ClubBadge'
import WinProbBar from './WinProbBar'

const kickOff = new Intl.DateTimeFormat('en-KE', {
  timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export default function FixtureCard({ fixture, followed = false }: { fixture: Fixture; followed?: boolean }) {
  const score = fixture.homeScore != null && fixture.awayScore != null
    ? `${fixture.homeScore}–${fixture.awayScore}` : null
  const live = fixture.status === 'live'
  const final = fixture.status === 'final'
  const day = fixture.matchDate.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short' })
  const hasOdds = !final && fixture.winProbHome + fixture.winProbDraw + fixture.winProbAway > 0

  return <details className="desk-match" data-followed={followed || undefined}>
    <summary>
      <span className="desk-match-team home"><span>{fixture.homeName}</span><ClubBadge name={fixture.homeName} url={fixture.homeBadgeUrl} size={24} /></span>
      <span className="desk-match-score"><strong>{score ?? (final || live ? '—' : kickOff.format(fixture.matchDate))}</strong>
        <small className={live ? 'desk-live' : undefined}>{live ? fixture.matchClock || 'LIVE' : final ? 'FT' : day}</small></span>
      <span className="desk-match-team away"><ClubBadge name={fixture.awayName} url={fixture.awayBadgeUrl} size={24} /><span>{fixture.awayName}</span></span>
      <span className="desk-match-caret" aria-hidden="true">⌄</span>
    </summary>
    <div className="desk-match-body">
      <div className="desk-meta"><span>{fixture.competition}{fixture.round && ` · ${fixture.round}`}</span>
        {followed && <span className="desk-tag">Following</span>}
        {fixture.venue && <span>{fixture.venue}</span>}
      </div>
      {fixture.watchReason && <p className="desk-muted">{fixture.watchReason}</p>}
      {fixture.recap && <p>{fixture.recap}</p>}
      {!!fixture.goals?.length && <ol className="desk-goals" aria-label="Goal timeline">
        {fixture.goals.map((goal, index) => <li key={`${goal.player}-${goal.seconds}-${index}`}><time>{goal.clock}</time>
          <span>{goal.player}</span><small>{goal.teamId === fixture.homeTeamId ? fixture.homeName : fixture.awayName}</small></li>)}
      </ol>}
      {fixture.preview && <div className="story-body">{fixture.preview.split('\n\n').map((text, index) => <p key={index}>{text}</p>)}</div>}
      {fixture.refereeName && <p className="desk-muted">Referee · {fixture.refereeName}{fixture.refereeNote && ` · ${fixture.refereeNote}`}</p>}
      {hasOdds && <WinProbBar home={fixture.winProbHome} draw={fixture.winProbDraw} away={fixture.winProbAway}
        homeColor={fixture.homeColorPrimary} awayColor={fixture.awayColorPrimary} homeName={fixture.homeName} awayName={fixture.awayName} />}
      {fixture.sourceUrl && <a className="desk-link" href={fixture.sourceUrl} target="_blank" rel="noreferrer">Full match centre on ESPN ↗</a>}
    </div>
  </details>
}
