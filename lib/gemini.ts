import { GoogleGenerativeAI } from '@google/generative-ai'
import { adminDb } from './firebase-admin'
import admin from 'firebase-admin'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  for (const team of PRIORITY_TEAMS) {
    try {
      const result = await model.generateContent(
        buildPrompt(team.name, team.tag, JSON.stringify({ teamId: team.id, weekLabel, league: team.league }))
      )
      const text = result.response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)

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
      // Respect Gemini free tier rate limits
      await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
      console.error(`Story generation failed for ${team.name}:`, e)
    }
  }
}

export async function generateHumorItems(matchEvents: string[]): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `You write football humor for lmkEuroSoka. Style: Grammy opening monologue — warm, self-aware, affectionate. 
RULES:
- DO: puns on scorelines, absurdist media observations, Peter Drury-style Shakespeare on mundane results, Onion-style headlines
- DO NOT: mock a club's quality or fanbase, target players personally
Based on these match events: ${matchEvents.join(', ')}
Return ONLY a JSON array of 6 humor strings, no markdown fences.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}
