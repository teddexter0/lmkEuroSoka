import type { Fixture, StandingRow } from '@/types'

const LEAGUES:Record<string,string>={EPL:'4328',LA_LIGA:'4335',BUNDESLIGA:'4331',SERIE_A:'4332',LIGUE_1:'4334',UCL:'4480'}
const TEAM_IDS:Record<string,string>={
  'Manchester United':'MUN','Arsenal':'ARS','Manchester City':'MCI','Liverpool':'LFC','Chelsea':'CFC','Tottenham Hotspur':'TOT','Newcastle United':'NEW',
  'Fulham':'FUL','Brighton':'BRI','Brighton & Hove Albion':'BRI','Bournemouth':'BOU','AFC Bournemouth':'BOU','Crystal Palace':'CRY','Barcelona':'BAR',
  'Real Madrid':'RMA','Atlético Madrid':'ATM','Atletico Madrid':'ATM','Bayern Munich':'BMU','Borussia Dortmund':'BVB','Bayer Leverkusen':'LEV',
  'Inter Milan':'INT','AC Milan':'ACM','Juventus':'JUV','Paris SG':'PSG','Paris Saint-Germain':'PSG','Monaco':'ASM',
}
function teamId(name:string):string{return TEAM_IDS[name] || name.replace(/[^a-z]/gi,'').slice(0,3).toUpperCase()}
function seasonLabel(date=new Date()):string{const start=date.getUTCMonth()>=6?date.getUTCFullYear():date.getUTCFullYear()-1;return `${start}-${start+1}`}
async function sportsDb(path:string){
  const response=await fetch(`https://www.thesportsdb.com/api/v1/json/123/${path}`,{next:{revalidate:900},headers:{Accept:'application/json'},signal:AbortSignal.timeout(12_000)})
  if(!response.ok) throw new Error(`TheSportsDB returned ${response.status}`)
  return response.json()
}
function eventDate(event:any):Date {const raw=event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`;return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(raw)?raw:`${raw}Z`)}
function fixtureStatus(event:any):Fixture['status'] {if(event.intHomeScore!==null && event.intAwayScore!==null)return 'final';if(['1H','2H','HT','LIVE'].includes(event.strStatus))return 'live';return 'scheduled'}

export async function fetchSportsDbFixtures(weekLabel:string):Promise<Fixture[]> {
  const results=await Promise.allSettled(Object.entries(LEAGUES).map(async([league,id])=>{
    const [past,next]=await Promise.all([sportsDb(`eventspastleague.php?id=${id}`),sportsDb(`eventsnextleague.php?id=${id}`)])
    return [...(past.events || []),...(next.events || [])].map((event:any)=>({
      id:String(event.idEvent),homeTeamId:teamId(event.strHomeTeam),awayTeamId:teamId(event.strAwayTeam),homeName:event.strHomeTeam,awayName:event.strAwayTeam,
      homeColorPrimary:'#333333',homeColorSecondary:'#ffffff',awayColorPrimary:'#333333',awayColorSecondary:'#ffffff',competition:event.strLeague,league,
      matchDate:eventDate(event),status:fixtureStatus(event),homeScore:event.intHomeScore===null?undefined:Number(event.intHomeScore),awayScore:event.intAwayScore===null?undefined:Number(event.intAwayScore),
      tier:'watch' as const,winProbHome:0,winProbDraw:0,winProbAway:0,preview:event.strResult || '',refereeName:event.strOfficial || '',refereeNote:'',isDerby:false,isPinned:false,weekLabel,
    }))
  }))
  const fixtures=results.flatMap(result=>result.status==='fulfilled'?result.value:[])
  if(!fixtures.length) throw new Error('Live fixture feeds returned no matches')
  return [...new Map(fixtures.map(fixture=>[fixture.id,fixture])).values()].sort((a,b)=>a.matchDate.getTime()-b.matchDate.getTime())
}

export async function fetchSportsDbStandings():Promise<Record<string,StandingRow[]>> {
  const season=seasonLabel()
  const results=await Promise.allSettled(Object.entries(LEAGUES).filter(([league])=>league!=='UCL').map(async([league,id])=>{
    const data=await sportsDb(`lookuptable.php?l=${id}&s=${season}`)
    const rows=(data.table || []).map((row:any,index:number)=>({rank:Number(row.intRank)||index+1,team:row.strTeam,teamId:teamId(row.strTeam),pts:Number(row.intPoints),
      w:Number(row.intWin),d:Number(row.intDraw),l:Number(row.intLoss),gd:String(row.intGoalDifference || '0'),form:String(row.strForm || '').replace(/[^WDL]/g,'').slice(-5),
      isUserClub:false,isTopFour:index<4,isRelegation:index>=(data.table?.length || 0)-3,isWatch:false}))
    return [league,rows] as const
  }))
  return Object.fromEntries(results.filter(result=>result.status==='fulfilled').map(result=>(result as PromiseFulfilledResult<readonly [string,StandingRow[]]>).value))
}
