import { unstable_cache } from 'next/cache'
import { TEAMS_SEED } from './seed-data'
import { fetchSportsDbFixtures, fetchSportsDbStandings } from './sportsdb'
import { buildEditorialStories } from './editorial'
import type { Fixture, WeeklyDigest } from '@/types'

function digestFrom(fixtures:Fixture[],weekLabel:string):WeeklyDigest {
  const upcoming=fixtures.filter(f=>f.status!=='final' && f.matchDate.getTime()>=Date.now()).slice(0,3)
  const recent=fixtures.filter(f=>f.status==='final').slice(-6)
  const featured=upcoming[0] || recent[recent.length-1]
  return {
    weekLabel,
    pinnedFixtures:upcoming.map(f=>({label:`${f.homeName} vs ${f.awayName}`,date:f.matchDate.toLocaleString('en-KE',{timeZone:'Africa/Nairobi',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),color:'#FFD700'})),
    humorItems:recent.map(f=>`${f.homeName} ${f.homeScore}–${f.awayScore} ${f.awayName}: ninety minutes, one scoreline, and several group chats needing moderation.`),
    wildcardTeamId:featured?.homeTeamId || 'MUN',
    wildcardReason:featured?`${featured.homeName} vs ${featured.awayName} is the next fixture worth keeping on the radar.`:'Fresh fixtures will appear on the next automatic refresh.',
    historyFacts:[],
  }
}

export const getLiveDashboard=unstable_cache(async(weekLabel:string)=>{
  const [fixturesResult,standingsResult,storiesResult]=await Promise.allSettled([
    fetchSportsDbFixtures(weekLabel),fetchSportsDbStandings(),buildEditorialStories(weekLabel,true),
  ])
  const fixtures=fixturesResult.status==='fulfilled'?fixturesResult.value:[]
  const standings=standingsResult.status==='fulfilled'?standingsResult.value:{}
  const stories=storiesResult.status==='fulfilled'?storiesResult.value:[]
  return {
    teams:TEAMS_SEED,fixtures,standings,stories,digest:digestFrom(fixtures,weekLabel),
    prevWeeks:[weekLabel],stats:[],selectedTeams:[],
    refresh:{success:Boolean(fixtures.length),provider:'thesportsdb+google-news',completedAt:new Date().toISOString()},
  }
},['live-dashboard-v2'],{revalidate:1800,tags:['live-dashboard']})
