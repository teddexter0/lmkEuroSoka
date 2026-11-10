import admin from 'firebase-admin'
import { adminDb } from './firebase-admin'
import { generateEditorial } from './ai'
import { fetchTeamNews, type NewsItem } from './news'
import { getAiConfig } from './config'
import { footballHumor } from './curation'
import type { Fixture, Story } from '@/types'

const PRIORITY_TEAMS = [
  {id:'MUN',name:'Manchester United',league:'EPL',tag:'YOUR UNITED'},
  {id:'BAR',name:'FC Barcelona',league:'LA_LIGA',tag:'YOUR BARÇA'},
  {id:'ARS',name:'Arsenal',league:'EPL',tag:'ARSENAL'},
  {id:'MCI',name:'Manchester City',league:'EPL',tag:'MAN CITY'},
  {id:'LFC',name:'Liverpool',league:'EPL',tag:'LIVERPOOL'},
  {id:'CFC',name:'Chelsea',league:'EPL',tag:'CHELSEA'},
  {id:'NEW',name:'Newcastle United',league:'EPL',tag:'NEWCASTLE'},
  {id:'PSG',name:'Paris Saint-Germain',league:'LIGUE_1',tag:'PSG'},
  {id:'BMU',name:'Bayern Munich',league:'BUNDESLIGA',tag:'BAYERN'},
] as const

function promptFor(teamName:string, weekLabel:string, articles:NewsItem[]):string {
  const evidence=articles.map((a,i)=>`${i+1}. ${a.title} — ${a.source} (${a.publishedAt})`).join('\n')
  return `Write a concise weekly football briefing for ${teamName}, week ${weekLabel}.
Use ONLY the supplied headlines as factual evidence. Never invent scores, injuries, quotes, transfers, tactics, or statistics.
Clearly attribute uncertain reports (for example: "According to Sky Sports..."). If evidence is thin, say so.
Tone: vivid opening, then direct analytical prose. 250-400 words.

HEADLINES:
${evidence}

Return JSON only: {"druryQuote":"one vivid but factual sentence","body":"3-5 paragraphs separated by \\n\\n"}`
}

function fallbackEditorial(articles:NewsItem[]) {
  return {
    druryQuote: '',
    body: articles.length ? '' : 'No recent club developments surfaced in the news feed.',
  }
}

async function mapWithConcurrency<T,R>(items:readonly T[], concurrency:number, fn:(item:T)=>Promise<R>):Promise<R[]> {
  const results:R[]=[]
  let cursor=0
  async function worker(){
    while(cursor<items.length){
      const index=cursor++
      results[index]=await fn(items[index])
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},worker))
  return results
}

export async function generateAndUpsertStories(weekLabel:string) {
  const stories=await buildEditorialStories(weekLabel)
  await Promise.all(stories.map(story=>adminDb.collection('stories').doc(story.id).set({
    ...story,aiProvider:getAiConfig().provider,createdAt:admin.firestore.Timestamp.now(),
  },{merge:true})))
  return {provider:getAiConfig().provider,written:stories.length,failed:PRIORITY_TEAMS.filter(team=>!stories.some(story=>story.teamId===team.id)).map(team=>team.id)}
}

export async function buildEditorialStories(weekLabel:string, enhanceWithAi=true):Promise<Story[]> {
  const ai=getAiConfig()
  const outcomes=await mapWithConcurrency(PRIORITY_TEAMS,3,async team=>{
    try {
      const articles=await fetchTeamNews(team.name)
      let editorial=fallbackEditorial(articles)
      if(enhanceWithAi && articles.length && ai.provider!=='fallback') {
        try { editorial=(await generateEditorial(promptFor(team.name,weekLabel,articles))) || editorial }
        catch(error){ console.warn(`[editorial] ${team.id} AI fallback:`,error) }
      }
      return {
        id:`${team.id}-${weekLabel}`,teamId:team.id,league:team.league,tag:team.tag,
        title:articles[0]?.title || team.name,druryQuote:editorial.druryQuote,body:editorial.body,
        statsJson:[],sources:articles.map(({title,url,source,publishedAt})=>({title,url,source,publishedAt})),
        weekLabel,isActive:true,
      } satisfies Story
    } catch(error) {
      console.error(`[editorial] ${team.id} failed:`,error)
      return null
    }
  })
  return outcomes.filter(Boolean) as Story[]
}

export async function generateAndUpsertDigest(weekLabel:string) {
  const snapshot=await adminDb.collection('fixtures').where('weekLabel','==',weekLabel).get()
  const fixtures=snapshot.docs.map(doc=>doc.data()).sort((a,b)=>a.matchDate.toMillis()-b.matchDate.toMillis())
  const upcoming=fixtures.filter(f=>f.status!=='final' && f.matchDate.toMillis()>=Date.now()).slice(0,3)
  const pinnedFixtures=upcoming.map(f=>({
    label:`${f.homeName} vs ${f.awayName}`,
    date:new Date(f.matchDate.toMillis()).toLocaleString('en-KE',{timeZone:'Africa/Nairobi',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    color:'#FFD700',
  }))
  const humorItems=footballHumor(fixtures.map(f => ({ ...f, matchDate: f.matchDate.toDate() } as Fixture)), PRIORITY_TEAMS.map(team => team.id))
  const wildcard=PRIORITY_TEAMS.find(team=>fixtures.some(f=>f.homeTeamId===team.id || f.awayTeamId===team.id)) || PRIORITY_TEAMS[0]
  await adminDb.collection('weeklyDigest').doc(weekLabel).set({
    weekLabel,pinnedFixtures,humorItems,wildcardTeamId:wildcard.id,
    wildcardReason:`${wildcard.name} has a fixture in the current data window. Follow its source-backed briefing for the week's context.`,
    historyFacts:[],generatedAt:admin.firestore.Timestamp.now(),
  },{merge:true})
  return {written:1,fixtures:fixtures.length}
}
