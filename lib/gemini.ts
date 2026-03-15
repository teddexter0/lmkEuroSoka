import Anthropic from '@anthropic-ai/sdk'
import { adminDb } from './firebase-admin'
import admin from 'firebase-admin'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PRIORITY_TEAMS = [
  { id: 'MUN', name: 'Manchester United', league: 'Premier League', tag: 'YOUR UNITED' },
  { id: 'BAR', name: 'FC Barcelona',      league: 'La Liga',        tag: 'YOUR BARÇA' },
  { id: 'ARS', name: 'Arsenal',           league: 'Premier League', tag: 'ARSENAL' },
  { id: 'MCI', name: 'Manchester City',   league: 'Premier League', tag: 'MAN CITY' },
  { id: 'LFC', name: 'Liverpool',         league: 'Premier League', tag: 'LIVERPOOL' },
  { id: 'CFC', name: 'Chelsea',           league: 'Premier League', tag: 'CHELSEA' },
  { id: 'NEW', name: 'Newcastle United',  league: 'Premier League', tag: 'NEWCASTLE' },
  { id: 'PSG', name: 'PSG',              league: 'Ligue 1',        tag: 'PSG' },
  { id: 'BMU', name: 'Bayern Munich',     league: 'Bundesliga',     tag: 'BAYERN' },
]

function buildPrompt(teamName: string, tag: string, rawData: string): string {
  return `You are the head correspondent for lmkEuroSoka, a personal football intelligence platform.
Your writing style blends:
- Peter Drury: poetic, Shakespearean openers that make the mundane feel epic
- The Athletic: deep, analytical body content with specific stats and context
- Joe Rogan: direct, no-BS, conversational — no corporate waffle
- Megyn Kelly: source everything, don't speculate, hold positions with confidence

Your reader (Ted, 20, Nairobi, Kenya) follows ${teamName} closely. He has 60 minutes/week total for all football.
He wants DEPTH, not summaries. He wants the thing nobody else is saying.
Write a 600-word story for ${teamName} this week covering ALL of:

1. OPENING: 2-3 sentence Peter Drury poetic opener (will be shown in italics)
2. FORM & POSITION: current league/UCL standing and recent results (specific scores)
3. KEY PLAYERS: 2-3 players — current form, stats, injury updates (name actual players)
4. TRANSFER/OWNERSHIP: any recent transfer activity, rumours, financial news
5. TACTICAL INSIGHT: what is evolving or changing in how they play
6. THE BLIND SPOT: one thing mainstream coverage is missing — emerging player, data anomaly, tactical shift
7. SCOUTING DESK: one youth/academy player to watch with a reason why

Raw data context: ${rawData}

Return ONLY valid JSON, no markdown fences:
{"druryQuote":"...", "body":"paragraph1\\n\\nparagraph2\\n\\nparagraph3\\n\\nparagraph4\\n\\nparagraph5\\n\\nparagraph6"}`
}

export async function generateAndUpsertStories(weekLabel: string) {
  await Promise.allSettled(
    PRIORITY_TEAMS.map(async (team) => {
      try {
        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: buildPrompt(
              team.name,
              team.tag,
              JSON.stringify({ teamId: team.id, weekLabel, league: team.league })
            ),
          }],
        })

        const textBlock = response.content.find(b => b.type === 'text')
        if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response')

        const parsed = JSON.parse(textBlock.text.replace(/```json|```/g, '').trim())

        await adminDb.collection('stories').doc(`${team.id}-${weekLabel}`).set({
          id: `${team.id}-${weekLabel}`,
          teamId: team.id,
          league: team.league,
          tag: team.tag,
          title: `${team.name} — Week of ${weekLabel}`,
          druryQuote: parsed.druryQuote,
          body: parsed.body,
          statsJson: [],
          weekLabel,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
        }, { merge: true })

        console.log(`✓ Story generated for ${team.name}`)
      } catch (e) {
        console.error(`Story generation failed for ${team.name}:`, e)
      }
    })
  )
}

export async function generateHumorItems(matchEvents: string[]): Promise<string[]> {
  const prompt = `You write football humor for lmkEuroSoka. Style: Grammy opening monologue — warm, self-aware, affectionate.
RULES:
- DO: puns on scorelines, absurdist media observations, Peter Drury-style Shakespeare on mundane results, Onion-style headlines
- DO NOT: mock a club's quality or fanbase, target players personally
Based on these match events: ${matchEvents.join(', ')}
Return ONLY a JSON array of 6 humor strings, no markdown fences.`

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response')
  return JSON.parse(textBlock.text.replace(/```json|```/g, '').trim())
}

export async function generateAndUpsertDigest(weekLabel: string) {
  try {
    // Pull this week's fixtures to give Claude real context
    const fixturesSnap = await adminDb.collection('fixtures').where('weekLabel', '==', weekLabel).get()
    const matchEvents = fixturesSnap.docs.map(d => {
      const f = d.data()
      const score = (f.homeScore != null && f.awayScore != null) ? `${f.homeScore}-${f.awayScore}` : 'upcoming'
      return `${f.homeName} vs ${f.awayName} (${score}, ${f.competition ?? f.league})`
    })

    const prompt = `You are the editorial AI for lmkEuroSoka, a personal football intelligence platform for Ted (20, Nairobi, Kenya).

Week: ${weekLabel}
Matches this week: ${matchEvents.length > 0 ? matchEvents.join(' | ') : 'UCL Round of 16 fixtures'}

Generate a weekly digest package. Return ONLY valid JSON (no markdown fences):
{
  "humorItems": [
    "6 strings — Grammy-monologue style football humor. Puns, absurdist observations, Peter Drury on mundane results. Warm and affectionate, never mean."
  ],
  "historyFacts": [
    {"date": "Month DD", "fact": "A short, surprising historical football fact relevant to this week in history (e.g. a famous result, birthday, signing)"},
    {"date": "Month DD", "fact": "..."},
    {"date": "Month DD", "fact": "..."},
    {"date": "Month DD", "fact": "..."}
  ],
  "wildcardTeamId": "one team ID from this list: MUN|BAR|ARS|MCI|LFC|CFC|NEW|PSG|BMU|TOT|FUL|BRI|BOU|CRY|ATM|RMA|BVB|LEV|INT|ACM|JUV|ASM — pick the most interesting underdog or emerging story of the week",
  "wildcardReason": "1-2 sentences explaining why this team is the wildcard pick — specific, no fluff",
  "pinnedFixtures": [
    {"label": "e.g. Liverpool vs Man City", "date": "e.g. Mar 16 · 17:30 EAT", "color": "#FF4500"},
    {"label": "...", "date": "...", "color": "#FFD700"}
  ]
}

Rules:
- humorItems: exactly 6 strings
- historyFacts: exactly 4 objects with short punchy facts
- wildcardTeamId: must be a real team ID from the list above
- pinnedFixtures: 2-3 of the most unmissable matches this week with EAT kickoff times`

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text in digest response')

    const parsed = JSON.parse(textBlock.text.replace(/```json|```/g, '').trim())

    await adminDb.collection('weeklyDigest').doc(weekLabel).set({
      weekLabel,
      humorItems: parsed.humorItems ?? [],
      historyFacts: parsed.historyFacts ?? [],
      wildcardTeamId: parsed.wildcardTeamId ?? null,
      wildcardReason: parsed.wildcardReason ?? '',
      pinnedFixtures: parsed.pinnedFixtures ?? [],
      generatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true })

    console.log(`✓ Weekly digest generated for ${weekLabel}`)
  } catch (e) {
    console.error(`Digest generation failed for ${weekLabel}:`, e)
  }
}
