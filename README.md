# lmkEuroSoka — Personal Football Intelligence Platform
## README FOR CLAUDE CODE — READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE

---

## 0. WHAT YOU ARE BUILDING

A personal weekly football intelligence dashboard for one user (Ted, based in Nairobi, Kenya, EAT timezone = UTC+3). This is NOT a generic sports app. It is a curated, narrative-driven, opinionated platform that delivers the week's European football like a knowledgeable friend who reads everything so Ted doesn't have to.

**The promise:** Ted opens this once a week, spends 60 minutes, and knows everything happening across his clubs in the EPL, La Liga, Bundesliga, Serie A, Ligue 1, and UCL.

**His primary clubs:** Man United ★, FC Barcelona ★  
**Also follows:** Arsenal, Man City, Liverpool, Chelsea, Spurs, Newcastle, Fulham, Brighton, Bournemouth, Crystal Palace, Real Madrid, Atlético Madrid, Villarreal, Bayern Munich, Dortmund, Leverkusen, Inter Milan, AC Milan, Juventus, PSG, Monaco

**Design feel:** Dark editorial. Think The Athletic meets a football war room. NOT a betting app. NOT Twitter. Cinematic, narrative, personal.

---

## 1. TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + inline styles for dynamic colors |
| Animation | Framer Motion |
| Database | **Firebase Firestore** (no Supabase) |
| Auth | None — single-user app, no login |
| Deployment | Vercel (free tier) |
| Sports data | API-Football (free tier, 100 req/day) |
| AI narratives | Google Gemini API (free tier) |
| YouTube | YouTube Data API v3 (free, 10k units/day) |
| Email digest | Brevo (optional, Phase 3) |
| Fonts | Google Fonts: Space Grotesk (display) + Inter (body) + JetBrains Mono (code/labels) |

---

## 2. FIREBASE SETUP (DO THIS FIRST)

### 2.1 Firebase Console Steps
1. Go to console.firebase.google.com
2. Create project: `lmkeurosoka`
3. Enable Firestore Database (production mode)
4. Go to Project Settings → Service Accounts → Generate new private key → save as `firebase-service-account.json` (NEVER commit this)
5. Go to Project Settings → General → copy the web app config

### 2.2 Firestore Security Rules
Paste this into Firestore → Rules tab. This is a single-user app — no auth, but we lock writes to server-side only:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for all collections (single-user dashboard, no sensitive data)
    match /{document=**} {
      allow read: if true;
      allow write: if false; // writes only via Admin SDK (server-side cron)
    }
  }
}
```

### 2.3 Firestore Collections & Document Schema

#### Collection: `teams`
Document ID = team abbreviation (e.g. `MUN`, `BAR`)
```json
{
  "id": "MUN",
  "name": "Manchester United",
  "shortName": "Man United",
  "league": "EPL",
  "colorPrimary": "#DA291C",
  "colorSecondary": "#000000",
  "badgeUrl": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "isUserSelected": true,
  "tier": "priority",
  "isWildcard": false,
  "createdAt": "timestamp"
}
```

#### Collection: `fixtures`
Document ID = `{homeId}-{awayId}-{YYYY-MM-DD}` e.g. `NEW-BAR-2026-03-10`
```json
{
  "id": "NEW-BAR-2026-03-10",
  "homeTeamId": "NEW",
  "awayTeamId": "BAR",
  "homeName": "Newcastle",
  "awayName": "Barcelona",
  "competition": "UCL R16 L1",
  "league": "UCL",
  "matchDate": "timestamp",
  "status": "scheduled",
  "homeScore": null,
  "awayScore": null,
  "tier": "unmissable",
  "winProbHome": 33.7,
  "winProbAway": 41.3,
  "winProbDraw": 25.0,
  "preview": "AI-generated narrative...",
  "refereeName": "Daniele Orsato",
  "refereeNote": "UCL specialist. Lets the game flow.",
  "isDerby": false,
  "isPinned": true,
  "weekLabel": "mar-7-2026"
}
```

#### Collection: `stories`
Document ID = `{teamId}-{weekLabel}` e.g. `MUN-mar-7-2026`
```json
{
  "id": "MUN-mar-7-2026",
  "teamId": "MUN",
  "league": "EPL",
  "tag": "YOUR UNITED",
  "title": "The Carrick Awakening",
  "druryQuote": "Once they were the Theatre of Dreams...",
  "body": "Full prose body (~600 words)...",
  "statsJson": ["3rd EPL · 51pts", "Sesko: 9g/4a", "Fernandes: 14g/17a"],
  "weekLabel": "mar-7-2026",
  "isActive": true,
  "createdAt": "timestamp"
}
```

#### Collection: `playerStats`
Document ID = `{teamId}-{playerName}-{weekLabel}`
```json
{
  "teamId": "MUN",
  "playerName": "Bruno Fernandes",
  "position": "MID",
  "goals": 14,
  "assists": 17,
  "xg": 8.4,
  "chancesCreated": 67,
  "ballRetentionPct": 88.2,
  "minutesPlayed": 2340,
  "appearances": 27,
  "isInjured": false,
  "injuryNote": null,
  "scoutingNote": null,
  "statWeek": "mar-7-2026"
}
```

#### Collection: `weeklyDigest`
Document ID = `{weekLabel}` e.g. `mar-7-2026`
```json
{
  "weekLabel": "mar-7-2026",
  "wildcardTeamId": "ASM",
  "wildcardReason": "Monaco beat PSG 3-1 this week...",
  "historyFacts": [
    { "date": "Mar 7", "fact": "On this day in 1987, Maradona scored a hat-trick for Napoli..." },
    { "date": "Mar 10", "fact": "The first UCL match was played in September 1992..." },
    { "date": "Mar 11", "fact": "Ronaldo's Porto free kick, 2009. Peter Drury's finest call." }
  ],
  "humorItems": [
    "PSG lost 3-1 to Monaco. Their Director of Vibes has resigned.",
    "Real Madrid lost to Getafe at the Bernabéu. Getafe.",
    "Bodo/Glimt beat Inter. The whole of Norway celebrated by going to bed at 9pm."
  ],
  "pinnedFixtures": [
    { "label": "🔥 Newcastle vs Barcelona", "date": "Tue Mar 10 · 23:00 EAT", "color": "#A50044" },
    { "label": "⚔️ Real Madrid vs Man City", "date": "Wed Mar 11 · 23:00 EAT", "color": "#FEBE10" },
    { "label": "🔴 Man Utd vs Aston Villa", "date": "Sun Mar 15 · 17:00 EAT", "color": "#DA291C" },
    { "label": "🏆 Barça vs Newcastle (L2)", "date": "Wed Mar 18 · 21:45 EAT", "color": "#004D98" },
    { "label": "🏟️ UCL FINAL — Budapest", "date": "Sat May 30", "color": "#F5C842" }
  ],
  "generatedAt": "timestamp"
}
```

#### Collection: `userPreferences`
Document ID = `ted` (single document)
```json
{
  "selectedTeams": ["MUN", "BAR", "ARS", "MCI", "LFC", "CFC", "TOT", "NEW", "FUL", "BRI", "BOU", "CRY", "ATM", "RMA", "PSG", "BMU", "BVB", "LEV", "INT", "ACM", "JUV", "ASM"],
  "activeLeague": "EPL",
  "updatedAt": "timestamp"
}
```

### 2.4 Firebase Seed Script
After setting up Firebase, run `npm run seed` which executes `scripts/seed.ts`. This seeds all collections with the static data in `lib/seed-data.ts`. The seed script uses the Firebase Admin SDK.

---

## 3. ENVIRONMENT VARIABLES

Create `.env.local`:
```
# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side only — NEVER expose client-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# APIs
FOOTBALL_API_KEY=        # api-football.com — free tier
GEMINI_API_KEY=          # Google AI Studio — free tier
YOUTUBE_API_KEY=         # Google Cloud Console — YouTube Data API v3

# Optional
BREVO_API_KEY=           # email digest, Phase 3 only
```

---

## 4. FILE STRUCTURE

```
lmkeurosoka/
├── README.md                        ← THIS FILE
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                      ← cron job config
├── .env.local                       ← never commit
├── .gitignore
│
├── app/
│   ├── layout.tsx                   ← root layout, fonts, metadata
│   ├── page.tsx                     ← home page, renders <Dashboard />
│   ├── globals.css
│   └── api/
│       ├── cron/
│       │   └── route.ts             ← weekly data refresh (Vercel cron)
│       ├── stories/
│       │   └── route.ts             ← Gemini story generation
│       └── youtube/
│           └── route.ts             ← CBS Golazo video fetch
│
├── components/
│   ├── Dashboard.tsx                ← main layout controller
│   ├── LeagueNav.tsx                ← league switcher strip
│   ├── FixtureCard.tsx              ← single fixture with kit gradients
│   ├── FixtureList.tsx              ← filtered list of FixtureCards
│   ├── StoryCard.tsx                ← accordion story with Drury quote
│   ├── PlayerStatsPanel.tsx         ← top 5 G/A/xG per team
│   ├── StandingsTable.tsx           ← league table with form dots
│   ├── TeamSelector.tsx             ← full-screen overlay team picker
│   ├── PinnedFixtures.tsx           ← arrow-icon mouth-watering fixtures
│   ├── HistoryTicker.tsx            ← auto-rotating historical fact
│   ├── WildcardCard.tsx             ← weekly wildcard team recommendation
│   ├── HumorSection.tsx             ← weekly wit (Grammy monologue style)
│   ├── GolazoPanel.tsx              ← CBS Golazo YouTube embed
│   ├── UCLBracket.tsx               ← UCL R16 full bracket
│   ├── WinProbBar.tsx               ← home/draw/away probability bar
│   ├── FormDots.tsx                 ← W/D/L neon dots
│   └── KitGradient.tsx              ← kit color split background
│
├── lib/
│   ├── firebase.ts                  ← client-side Firebase init
│   ├── firebase-admin.ts            ← server-side Admin SDK init
│   ├── firestore.ts                 ← all Firestore read/write functions
│   ├── football-api.ts              ← API-Football fetch + transform
│   ├── gemini.ts                    ← Gemini story generation
│   ├── youtube.ts                   ← YouTube Data API fetch
│   ├── seed-data.ts                 ← full static seed data (teams, fixtures, stories)
│   └── utils.ts                     ← EAT timezone, daysUntil, weekLabel, etc.
│
├── types/
│   └── index.ts                     ← Team, Fixture, Story, PlayerStat, WeeklyDigest
│
├── scripts/
│   └── seed.ts                      ← Firebase seed script (npm run seed)
│
└── public/
    └── og-image.png
```

---

## 5. TYPES (`types/index.ts`)

```typescript
export interface Team {
  id: string
  name: string
  shortName: string
  league: League
  colorPrimary: string
  colorSecondary: string
  badgeUrl: string
  isUserSelected: boolean
  tier: 'priority' | 'watch' | 'underdog'
  isWildcard: boolean
}

export type League = 'EPL' | 'LA_LIGA' | 'BUNDESLIGA' | 'SERIE_A' | 'LIGUE_1' | 'UCL'

export interface LeagueTheme {
  name: string
  primary: string
  accent: string
  textColor: string
  badge: string
}

export interface Fixture {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeName: string
  awayName: string
  homeColorPrimary?: string
  homeColorSecondary?: string
  awayColorPrimary?: string
  awayColorSecondary?: string
  competition: string
  league: League | 'UCL'
  matchDate: Date
  status: 'scheduled' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
  tier: 'unmissable' | 'priority' | 'watch'
  winProbHome: number
  winProbAway: number
  winProbDraw: number
  preview: string
  refereeName?: string
  refereeNote?: string
  isDerby: boolean
  isPinned: boolean
  weekLabel: string
}

export interface Story {
  id: string
  teamId: string
  league: string
  tag: string
  title: string
  druryQuote: string
  body: string
  statsJson: string[]
  weekLabel: string
  isActive: boolean
}

export interface PlayerStat {
  teamId: string
  playerName: string
  position: string
  goals: number
  assists: number
  xg: number
  chancesCreated: number
  ballRetentionPct: number
  minutesPlayed: number
  appearances: number
  isInjured: boolean
  injuryNote?: string
  scoutingNote?: string
}

export interface WeeklyDigest {
  weekLabel: string
  wildcardTeamId: string
  wildcardReason: string
  historyFacts: { date: string; fact: string }[]
  humorItems: string[]
  pinnedFixtures: { label: string; date: string; color: string }[]
}

export interface StandingRow {
  rank: number
  team: string
  teamId?: string
  pts: number
  w: number
  d: number
  l: number
  gd: string
  form: string
  isUserClub?: boolean
  isTopFour?: boolean
  isRelegation?: boolean
  isWatch?: boolean
}

export interface YoutubeVideo {
  videoId: string
  title: string
  thumbnail: string
  publishedAt: string
}
```

---

## 6. LEAGUE THEMES (`lib/utils.ts`)

```typescript
import { LeagueTheme, League } from '@/types'

export const LEAGUE_THEMES: Record<string, LeagueTheme> = {
  EPL:        { name: 'Premier League',   primary: '#3D195B', accent: '#00FF85', textColor: '#E8F5E9', badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  LA_LIGA:    { name: 'La Liga',          primary: '#EE1111', accent: '#FFCC00', textColor: '#FFF8E1', badge: '🇪🇸' },
  BUNDESLIGA: { name: 'Bundesliga',       primary: '#D20515', accent: '#FFFFFF', textColor: '#FFFFFF', badge: '🇩🇪' },
  SERIE_A:    { name: 'Serie A',          primary: '#1B3F8B', accent: '#009246', textColor: '#E3F0FF', badge: '🇮🇹' },
  LIGUE_1:    { name: 'Ligue 1',         primary: '#16213E', accent: '#00A9E0', textColor: '#E0F4FF', badge: '🇫🇷' },
  UCL:        { name: 'Champions League', primary: '#0A1628', accent: '#F5C842', textColor: '#FFFDE7', badge: '⭐' },
}

export function getWeekLabel(date = new Date()): string {
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  return `${months[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`
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
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

export function currentWeekLabel(): string {
  return getWeekLabel(new Date())
}
```

---

## 7. FIREBASE CLIENT (`lib/firebase.ts`)

```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
```

---

## 8. FIREBASE ADMIN (`lib/firebase-admin.ts`)

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore()
```

---

## 9. FIRESTORE FUNCTIONS (`lib/firestore.ts`)

```typescript
import { db } from './firebase'
import { adminDb } from './firebase-admin'
import {
  collection, doc, getDocs, getDoc, setDoc, query,
  where, orderBy, limit, Timestamp
} from 'firebase/firestore'
import type { Team, Fixture, Story, PlayerStat, WeeklyDigest, StandingRow } from '@/types'

// ── CLIENT READS ──────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'teams'))
  return snap.docs.map(d => d.data() as Team)
}

export async function getSelectedTeams(): Promise<Team[]> {
  const q = query(collection(db, 'teams'), where('isUserSelected', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Team)
}

export async function getFixturesByWeek(weekLabel: string): Promise<Fixture[]> {
  const q = query(
    collection(db, 'fixtures'),
    where('weekLabel', '==', weekLabel),
    orderBy('matchDate', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return { ...data, matchDate: data.matchDate.toDate() } as Fixture
  })
}

export async function getStoriesByWeek(weekLabel: string): Promise<Story[]> {
  const q = query(
    collection(db, 'stories'),
    where('weekLabel', '==', weekLabel),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Story)
}

export async function getPlayerStatsByTeam(teamId: string, weekLabel: string): Promise<PlayerStat[]> {
  const q = query(
    collection(db, 'playerStats'),
    where('teamId', '==', teamId),
    where('statWeek', '==', weekLabel)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as PlayerStat)
}

export async function getWeeklyDigest(weekLabel: string): Promise<WeeklyDigest | null> {
  const snap = await getDoc(doc(db, 'weeklyDigest', weekLabel))
  return snap.exists() ? snap.data() as WeeklyDigest : null
}

export async function getUserPreferences() {
  const snap = await getDoc(doc(db, 'userPreferences', 'ted'))
  return snap.exists() ? snap.data() : { selectedTeams: [], activeLeague: 'EPL' }
}

export async function getPreviousWeekLabels(count = 4): Promise<string[]> {
  const q = query(collection(db, 'weeklyDigest'), orderBy('generatedAt', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.id)
}

// ── SERVER WRITES (Admin SDK — used in cron only) ─────────────────────────────

export async function upsertTeam(team: Team) {
  await adminDb.collection('teams').doc(team.id).set(team, { merge: true })
}

export async function upsertFixture(fixture: any) {
  await adminDb.collection('fixtures').doc(fixture.id).set(fixture, { merge: true })
}

export async function upsertStory(story: any) {
  await adminDb.collection('stories').doc(story.id).set(story, { merge: true })
}

export async function upsertPlayerStat(stat: any) {
  const id = `${stat.teamId}-${stat.playerName.replace(/\s+/g,'-')}-${stat.statWeek}`
  await adminDb.collection('playerStats').doc(id).set(stat, { merge: true })
}

export async function upsertWeeklyDigest(digest: any) {
  await adminDb.collection('weeklyDigest').doc(digest.weekLabel).set({
    ...digest, generatedAt: new Date()
  }, { merge: true })
}

export async function updateUserPreferences(prefs: any) {
  await adminDb.collection('userPreferences').doc('ted').set({
    ...prefs, updatedAt: new Date()
  }, { merge: true })
}
```

---

## 10. SEED DATA (`lib/seed-data.ts`)

This file contains ALL the hardcoded data for the initial seed. Include the full list of ~50 teams with their exact hex colors and Wikipedia badge URLs. Include the full fixture list for the current week (Mar 7–18 2026) with narratives, referee info, and win probabilities. Include stories for MUN, BAR, ARS, MCI, Newcastle, Chelsea, Liverpool, PSG, Bayern, Inter/Milan derby, and a UCL overview. Include player stats for each priority team (top 5 G/A for each). Include the weekly digest for `mar-7-2026`.

### Teams to seed (full list):

**EPL:**
- MUN: Manchester United, #DA291C / #000000
- ARS: Arsenal, #EF0107 / #FFFFFF
- MCI: Man City, #6CABDD / #1C2C5B
- LFC: Liverpool, #C8102E / #F6EB61
- CFC: Chelsea, #034694 / #DBA111
- TOT: Spurs, #132257 / #FFFFFF
- NEW: Newcastle, #241F20 / #FFFFFF
- FUL: Fulham, #CC0000 / #000000
- BRI: Brighton, #0057B8 / #FFFFFF
- BOU: Bournemouth, #DA291C / #000000
- CRY: Crystal Palace, #1B458F / #C4122E
- EVE: Everton, #003399 / #FFFFFF
- AVL: Aston Villa, #95BFE5 / #670E36

**La Liga:**
- BAR: FC Barcelona, #A50044 / #004D98
- RMA: Real Madrid, #FEBE10 / #FFFFFF
- ATM: Atlético Madrid, #CE3524 / #FFFFFF
- VIL: Villarreal, #FFD700 / #009900
- RBB: Real Betis, #00954C / #FFFFFF
- SEV: Sevilla, #D2122E / #FFFFFF

**Bundesliga:**
- BMU: Bayern Munich, #DC052D / #0066B2
- BVB: Borussia Dortmund, #FDE100 / #000000
- LEV: Bayer Leverkusen, #E32221 / #000000
- RBL: RB Leipzig, #DD0741 / #001E3C
- SGE: Eintracht Frankfurt, #E1000F / #000000

**Serie A:**
- INT: Inter Milan, #0068A8 / #000000
- ACM: AC Milan, #FB090B / #000000
- JUV: Juventus, #000000 / #FFFFFF
- NAP: Napoli, #12A0C7 / #FFFFFF
- ATA: Atalanta, #1E4E8C / #000000

**Ligue 1:**
- PSG: PSG, #004170 / #DA291C
- ASM: Monaco, #CE1126 / #FFFFFF
- OLM: Marseille, #2FAEE0 / #FFFFFF
- LIL: Lille, #DA291C / #000000

**UCL-only:**
- GAL: Galatasaray, #DC143C / #FFD700
- BOG: Bodo/Glimt, #FFD700 / #000000

Badge URLs: use `https://upload.wikimedia.org/wikipedia/en/` paths for all major clubs. For less common clubs use `https://upload.wikimedia.org/wikipedia/commons/` paths. Look up exact filenames.

### Fixtures to seed (Mar 7–18 2026):

For each fixture include:
- The narrative preview (3 paragraphs, full prose)
- Referee name + note
- Win probabilities
- tier (unmissable/priority/watch)
- isDerby flag
- isPinned flag

Key fixtures:
1. Athletic vs Barcelona — Mar 7 La Liga (priority)
2. Newcastle vs Barcelona — Mar 10 UCL R16 L1 (UNMISSABLE)
3. Galatasaray vs Liverpool — Mar 10 UCL R16 L1 (watch)
4. Atlético vs Spurs — Mar 10 UCL R16 L1 (watch)
5. Atalanta vs Bayern — Mar 10 UCL R16 L1 (watch)
6. Leverkusen vs Arsenal — Mar 11 UCL R16 L1 (UNMISSABLE)
7. Real Madrid vs Man City — Mar 11 UCL R16 L1 (UNMISSABLE)
8. PSG vs Chelsea — Mar 11 UCL R16 L1 (watch)
9. AC Milan vs Inter — Mar 8 Serie A Derby (watch — DERBY)
10. Man Utd vs Aston Villa — Mar 15 EPL (priority)
11. Arsenal vs Everton — Mar 14 EPL (watch)
12. Chelsea vs Newcastle — Mar 14 EPL (watch)
13. Liverpool vs Spurs — Mar 15 EPL (watch)
14. Man City vs Real Madrid — Mar 17 UCL R16 L2 (UNMISSABLE)
15. Barcelona vs Newcastle — Mar 18 UCL R16 L2 (UNMISSABLE)

### Stories to seed:

Write full stories (~600 words each) for:
- MUN: "The Carrick Awakening" — United 3rd, 11-game unbeaten run snapped at Newcastle, Sesko/Fernandes form, Mount return, injury list
- BAR: "Flick's Symphony" — La Liga leaders 65pts, Rashford at Barça, Yamal/Pedri, De Jong absent, financial/stadium note, Marc Bernal scouting
- ARS: "Arteta's North London Crusade" — EPL leaders 67pts, quadruple possibility, tactical evolution, Nwaneri scouting
- UCL: "The Round That Changes Everything" — Overview of R16, bracket analysis, dark horse Monaco
- MCI: "Haaland's Crusade" — 2nd in EPL, UCL vs Real Madrid trilogy, Guardiola's evolution
- NEW: "The Magpies in Europe" — underdog story, injury crisis, UCL vs Barça, Eddie Howe
- PSG: "Post-Mbappé Reinvention" — Kvaratskhelia, UCL vs Chelsea, Ligue 1 loss to Monaco
- BMU: "Kane's Redemption Arc" — Bundesliga, UCL vs Atalanta, Harry Kane goals
- CFC: "Chelsea's European Surge" — 4-1 vs Villa, UCL vs PSG, form analysis
- DERBY: "Derby della Madonnina" — Milan vs Inter preview, city rivalry context

### Player stats to seed:

For each priority team (MUN, BAR, ARS, MCI, LFC, CFC, NEW), seed top 5 by goals, noting assists, xG, chances created. Include one "scouting" player per team with a note.

---

## 11. SEED SCRIPT (`scripts/seed.ts`)

```typescript
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { TEAMS_SEED, FIXTURES_SEED, STORIES_SEED, PLAYER_STATS_SEED, WEEKLY_DIGEST_SEED } from '../lib/seed-data'

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore(app)

async function seed() {
  console.log('Seeding teams...')
  for (const team of TEAMS_SEED) {
    await db.collection('teams').doc(team.id).set(team)
  }

  console.log('Seeding fixtures...')
  for (const fixture of FIXTURES_SEED) {
    await db.collection('fixtures').doc(fixture.id).set({
      ...fixture,
      matchDate: Timestamp.fromDate(new Date(fixture.matchDate))
    })
  }

  console.log('Seeding stories...')
  for (const story of STORIES_SEED) {
    await db.collection('stories').doc(story.id).set({
      ...story,
      createdAt: Timestamp.now()
    })
  }

  console.log('Seeding player stats...')
  for (const stat of PLAYER_STATS_SEED) {
    const id = `${stat.teamId}-${stat.playerName.replace(/\s+/g,'-')}-${stat.statWeek}`
    await db.collection('playerStats').doc(id).set(stat)
  }

  console.log('Seeding weekly digest...')
  await db.collection('weeklyDigest').doc(WEEKLY_DIGEST_SEED.weekLabel).set({
    ...WEEKLY_DIGEST_SEED,
    generatedAt: Timestamp.now()
  })

  console.log('Seeding user preferences...')
  await db.collection('userPreferences').doc('ted').set({
    selectedTeams: ['MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY','ATM','RMA','PSG','BMU','BVB','LEV','INT','ACM','JUV','ASM'],
    activeLeague: 'EPL',
    updatedAt: Timestamp.now()
  })

  console.log('✅ Seed complete')
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
```

---

## 12. CRON JOB (`app/api/cron/route.ts`)

```typescript
import { NextResponse } from 'next/server'
import { fetchAndUpsertFixtures } from '@/lib/football-api'
import { generateAndUpsertStories } from '@/lib/gemini'
import { fetchGolazoVideo } from '@/lib/youtube'
import { upsertWeeklyDigest } from '@/lib/firestore'
import { currentWeekLabel } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  // Verify this is called by Vercel cron (or manually)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekLabel = currentWeekLabel()

  try {
    await fetchAndUpsertFixtures(weekLabel)
    await generateAndUpsertStories(weekLabel)
    await upsertWeeklyDigest({ weekLabel, generatedAt: new Date() })

    return NextResponse.json({ success: true, weekLabel })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
```

---

## 13. YOUTUBE API ROUTE (`app/api/youtube/route.ts`)

```typescript
import { NextResponse } from 'next/server'

const CBS_GOLAZO_CHANNEL_ID = 'UCcJ6L_EM3H3NLZE7DJDe1g'

export async function GET() {
  const publishedAfter = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('channelId', CBS_GOLAZO_CHANNEL_ID)
  url.searchParams.set('q', 'Champions League')
  url.searchParams.set('type', 'video')
  url.searchParams.set('order', 'viewCount')
  url.searchParams.set('publishedAfter', publishedAfter)
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY!)

  const res = await fetch(url.toString())
  const data = await res.json()

  const items = data.items?.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url,
    publishedAt: item.snippet.publishedAt,
  })) || []

  // Filter for the quadruple (Kate/Micah/Jamie/Henry) show specifically
  const golazoShow = items.find((v: any) =>
    /UCL|Champions League/i.test(v.title) &&
    !/highlights only|goals only/i.test(v.title)
  ) || items[0] || null

  return NextResponse.json({ video: golazoShow })
}
```

---

## 14. GEMINI STORY GENERATION (`lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { upsertStory } from './firestore'
import { currentWeekLabel } from './utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PRIORITY_TEAMS = ['MUN', 'BAR', 'ARS', 'MCI', 'LFC', 'CFC', 'NEW', 'PSG', 'BMU']

const STORY_PROMPT = (teamName: string, rawData: string) => `
You are the head correspondent for lmkEuroSoka, a personal football intelligence platform.
Write in the style of: Peter Drury (poetic openers), The Athletic (deep analysis), Joe Rogan (direct, no-BS).
Your reader follows ${teamName} and has 60 minutes/week for all of football. Kenya-based (EAT timezone).

Write a 600-word story covering:
1. OPENING: 2-3 sentence Peter Drury poetic quote (will be displayed in italics)
2. FORM & POSITION: current league/UCL standing, recent results
3. KEY PLAYERS: form, stats, injuries (specific names and numbers)
4. TRANSFER/OWNERSHIP NEWS: any recent activity or rumours
5. TACTICAL INSIGHT: what's changed or evolving in how they play
6. THE THING NOBODY'S SAYING: emerging player, blind spot, underrated development
7. SCOUTING DESK: one academy/youth player to watch

Raw data for this week: ${rawData}

Output format: JSON with keys { druryQuote, body }
- druryQuote: just the opening 2-3 sentences
- body: the rest (paragraphs separated by \\n\\n, NO bullet points, prose only)
`

export async function generateAndUpsertStories(weekLabel: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  for (const teamId of PRIORITY_TEAMS) {
    try {
      const result = await model.generateContent(
        STORY_PROMPT(teamId, JSON.stringify({ teamId, weekLabel }))
      )
      const text = result.response.text()
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

      await upsertStory({
        id: `${teamId}-${weekLabel}`,
        teamId,
        league: 'EPL',
        tag: `${teamId} WEEKLY`,
        title: `Week of ${weekLabel}`,
        druryQuote: parsed.druryQuote,
        body: parsed.body,
        statsJson: [],
        weekLabel,
        isActive: true,
      })
    } catch (e) {
      console.error(`Story gen failed for ${teamId}:`, e)
    }
  }
}
```

---

## 15. DASHBOARD COMPONENT (`components/Dashboard.tsx`)

The Dashboard is the root component. It:
1. Fetches data from Firestore on mount using `useEffect`
2. Maintains state: `activeLeague`, `selectedTeams`, `activeTab`, `weekLabel`
3. Renders: LeagueNav → (tab content) → footer

### Tab structure:
- **FIXTURES** — filtered fixture list for active league, + PinnedFixtures + WildcardCard + HistoryTicker
- **STORIES** — StoryCard list for active league's teams
- **STATS** — PlayerStatsPanel grid (one per followed team)
- **TABLE** — StandingsTable for active league
- **TEAMS** — TeamSelector overlay
- **HUMOR** — HumorSection + GolazoPanel

### Data loading pattern:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getFixturesByWeek, getStoriesByWeek, getWeeklyDigest, getTeams } from '@/lib/firestore'
import { currentWeekLabel } from '@/lib/utils'

// Load all data in parallel:
const [fixtures, stories, digest, teams] = await Promise.all([
  getFixturesByWeek(weekLabel),
  getStoriesByWeek(weekLabel),
  getWeeklyDigest(weekLabel),
  getTeams()
])
```

---

## 16. FIXTURE CARD DESIGN (`components/FixtureCard.tsx`)

### Kit gradient implementation:
```tsx
// Subtle diagonal kit split — home color from left, away from right
// Center stays dark. Fades at ~35% so text remains readable.
// For striped kits (Newcastle, Juventus): use repeating-linear-gradient

const homeGradient = `linear-gradient(90deg, ${homeColorPrimary}55 0%, ${homeColorPrimary}00 40%)`
const awayGradient = `linear-gradient(270deg, ${awayColorPrimary}55 0%, ${awayColorPrimary}00 40%)`

// Apply both as background layers:
style={{ background: `${awayGradient}, ${homeGradient}, #0a0a14` }}
```

### Card structure (expanded state):
1. Tier badge (UNMISSABLE / PRIORITY / WATCH)
2. Competition label + UCL star if applicable
3. Teams row: home name | "vs" | away name (with color accents)
4. Time + daysUntil countdown
5. WinProbBar (home% | draw% | away%)
6. [EXPANDED]: full preview text (3 paragraphs)
7. [EXPANDED]: referee box (name + note)
8. [EXPANDED]: injury note if any

---

## 17. STANDINGS TABLE DESIGN (`components/StandingsTable.tsx`)

### Form dots:
```tsx
// W = #00E676 (neon green) with box-shadow: 0 0 6px #00E676
// D = #FFD700 (gold) with box-shadow: 0 0 6px #FFD700
// L = #FF1744 (red) with box-shadow: 0 0 6px #FF174488
// Order: LEFT = oldest, RIGHT = most recent
// Show 5 dots max

function FormDots({ form }: { form: string }) {
  const colors = { W: '#00E676', D: '#FFD700', L: '#FF1744' }
  return (
    <div className="flex gap-1">
      {form.split('').map((r, i) => (
        <div
          key={i}
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: colors[r as keyof typeof colors] || '#555',
            boxShadow: `0 0 6px ${colors[r as keyof typeof colors] || '#555'}88`
          }}
          title={r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}
        />
      ))}
    </div>
  )
}
```

### Row color zones:
- Rank 1-4: left border `#00E676` (UCL)
- Rank 5-6: left border `#00A9E0` (Europa League)
- Rank 18-20: left border `#FF1744` (relegation)
- User's clubs: row background `${colorPrimary}12`

---

## 18. TEAM SELECTOR (`components/TeamSelector.tsx`)

Full-screen overlay (fixed, z-index 500). Triggered by gear icon in nav.

- Organised by league sections (EPL, La Liga, Bundesliga, Serie A, Ligue 1)
- Each team = a card showing: team name, small colored dot in primary color
- Selected state: glowing border in team's primary color, background tint
- On toggle: updates local state AND writes to Firestore `userPreferences/ted`
- LG TV aesthetic: keyboard/touch navigable grid, smooth hover transitions
- "Done" button closes overlay and applies filter

---

## 19. PLAYER STATS PANEL (`components/PlayerStatsPanel.tsx`)

For each followed team, show a card with:

**Top 5 Goalscorers** (name, goals, apps)
**Top 5 Assisters** (name, assists, apps)  
**xG Leader** (name, xG, goals — shows over/underperformance)
**Chances Created Leader** (name, chances, assists)
**Ball Retention Leader** (name, pass%, minutes)
**Injury List** — red badge with return timeline
**Scouting Pick** — yellow badge with youngster + quote

Data comes from `playerStats` Firestore collection. If no data exists for the week, show a "Data refreshing..." skeleton.

---

## 20. HUMOR SECTION — CONTENT RULES (`components/HumorSection.tsx`)

**The humor must follow these rules — strictly:**
- ✅ Puns based on actual scorelines or match events
- ✅ Absurdist observations on media narratives
- ✅ Peter Drury-style Shakespeare applied to mundane results
- ✅ Onion-style mock headlines
- ✅ Affectionate teasing of managers or pundits
- ❌ Never mock a club's quality, history, or fanbase
- ❌ Never target players personally (only the result/situation)
- ❌ No dark humor about relegation for historic clubs
- **Energy: Grammy opening monologue — warm, self-aware, affectionate**

Example tone:
> "PSG lost 3-1 to Monaco at home in Ligue 1 this week. The Parc des Princes immediately appointed an emergency Director of Vibes. The previous three Directors of Vibes were unavailable for comment."

> "Real Madrid lost to Getafe at the Bernabéu. Getafe. The Bernabéu was briefly renamed The Theatre of Surprised Faces. Carlo Ancelotti was photographed staring at the ceiling for 40 uninterrupted seconds."

---

## 21. CBS GOLAZO PANEL (`components/GolazoPanel.tsx`)

- Full-width card below UCL fixtures
- Fetches from `/api/youtube` on mount
- Shows: YouTube iframe (no autoplay), title, published date
- Fallback: if no video found in last 72hrs, show playlist link
- Playlist URL: `https://www.youtube.com/playlist?list=PLEbJmiPaOw7PfMkNcJKLPJm08rLUFhpPM`
- Kate Abdo / Micah / Jamie / Henry branding in the card header
- NOT squeezed — full width, prominent placement, 16:9 ratio iframe

```tsx
<iframe
  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
  className="w-full aspect-video rounded-md"
  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

## 22. VERCEL CRON CONFIG (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 21 * * 0"
    }
  ]
}
```
This runs every Sunday at 21:00 UTC = midnight Monday EAT. Add `CRON_SECRET` to Vercel env vars.

---

## 23. PACKAGE.JSON

```json
{
  "name": "lmkeurosoka",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "ts-node --project tsconfig.seed.json scripts/seed.ts",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.8.0",
    "firebase-admin": "^12.0.0",
    "@google/generative-ai": "^0.3.0",
    "framer-motion": "^11.0.0",
    "date-fns": "^3.3.0",
    "date-fns-tz": "^3.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8",
    "ts-node": "^10.9.0",
    "eslint": "^8",
    "eslint-config-next": "14.2.0"
  }
}
```

---

## 24. DESIGN SYSTEM — EXACT SPEC

### Colors (use these — no approximations):
```
Background:       #07070f   (near-black, blue tint)
Card bg:          #0a0a14
Card border:      #1c1c2e
Card hover:       #0f0f1e
Text primary:     #e0e0ee
Text secondary:   #778899
Text muted:       #444466
Accent unmissable: #FF4500 (fire orange)
Accent priority:  #FFD700 (gold)
Accent watch:     #00BFFF (sky blue)
Success/W:        #00E676 (neon green)
Draw/D:           #FFD700 (gold)
Loss/L:           #FF1744 (red)
```

### Fonts (Google Fonts — add to `app/layout.tsx`):
```
Space Grotesk — display, headers, team names
Inter — body text, narratives
JetBrains Mono — labels, codes, stats, TIER BADGES
```

### NO pure black (#000). NO pure white (#fff). NO gradients using only purple. NO neon-on-neon combos. Keep it editorial, not betting-app.

---

## 25. MOBILE / RESPONSIVE

- Mobile (<768px): single column, chronological scroll, sticky bottom tab bar
- Tablet (768–1200px): two-column fixture grid
- Desktop (>1200px): centered 860px content, sticky left league nav sidebar
- Use Tailwind responsive prefixes (sm:, md:, lg:) throughout

---

## 26. API-FOOTBALL INTEGRATION (`lib/football-api.ts`)

Free tier: 100 requests/day. Base URL: `https://v3.football.api-sports.io`
Header: `x-apisports-key: YOUR_KEY`

Key endpoints:
```
GET /fixtures?league={id}&season=2025&next=7      → upcoming fixtures
GET /fixtures?league={id}&season=2025&last=7      → recent results
GET /standings?league={id}&season=2025            → table
GET /players?team={id}&season=2025                → player stats
GET /fixtures/events?fixture={id}                  → match events
```

League IDs: EPL=39, La Liga=140, Bundesliga=78, Serie A=135, Ligue 1=61, UCL=2

Transform all dates to EAT timezone before storing. Map team names to our internal team IDs using a lookup table. Store in Firestore via Admin SDK.

---

## 27. PREVIOUS WEEKS FEATURE

Add a "Previous Weeks" dropdown in the header. On select:
- Fetch that `weekLabel`'s fixtures and stories from Firestore
- Display with a "ARCHIVE — [week]" banner at top
- Default always loads current week

---

## 28. BUILD ORDER FOR CLAUDE CODE

**Do this in order. Do not skip steps.**

1. `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
2. `types/index.ts`
3. `lib/utils.ts`
4. `lib/firebase.ts` + `lib/firebase-admin.ts`
5. `lib/firestore.ts`
6. `lib/seed-data.ts` — **write ALL seed data here, full and complete**
7. `scripts/seed.ts`
8. `app/globals.css` + `app/layout.tsx` (fonts, metadata)
9. All components (in order listed in Section 4)
10. `app/page.tsx`
11. `app/api/youtube/route.ts`
12. `app/api/cron/route.ts`
13. `lib/football-api.ts`
14. `lib/gemini.ts`
15. `vercel.json`
16. `.gitignore`
17. Run `npm install` → `npm run seed` → `npm run dev` → verify

---

## 29. WHAT SHOULD WORK ON FIRST `npm run dev`

Without any API keys (just Firebase configured):
- Full dashboard loads with seed data
- League switcher changes colors
- Fixture cards expand with previews
- Stories accordion opens
- Standings table renders with form dots
- Team selector overlay works
- History ticker rotates
- Pinned fixtures visible
- Humor section renders
- Golazo panel shows fallback playlist link (no YouTube key yet)
- Previous weeks dropdown shows current week only

With API keys added:
- Golazo panel fetches and embeds latest UCL video
- Running `npm run seed` with Firebase credentials populates all data
- Cron endpoint refreshes data weekly

---

## 30. FINAL NOTES

- All times: EAT (Africa/Nairobi). Use `date-fns-tz` for all date math.
- Team badge `<img>` tags: use Wikipedia SVG URLs directly (CORS-safe for img tags, NOT for fetch)
- Never `autoplay` YouTube iframes
- The app should feel like a product, not a prototype. Every component gets proper loading states.
- If Firestore returns empty for a week, fall back to the most recent week's data automatically
- `npm run seed` is idempotent — safe to run multiple times (Firestore set with merge:true)
- The cron job is protected by `CRON_SECRET` env var — set this in Vercel dashboard
- Git: commit everything except `.env.local` and `firebase-service-account.json`

---

*lmkEuroSoka README v1.0 — March 2026 — For Claude Code*
*Stack: Next.js 14 · Firebase Firestore · Vercel · Gemini · YouTube Data API · API-Football*
# lmkEuroSoka
