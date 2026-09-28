# lmkEuroSoka

A personal European football briefing that refreshes itself every morning at 08:15 EAT. It runs in a zero-config mode by default: no football, YouTube, database, or AI key is required.

## What is automated

- Fixtures, recent results, and tables come from TheSportsDB's free public feed by default. football-data.org and API-Football remain supported as optional upgrades.
- Club news is collected from recent Google News RSS results and always displayed with source links.
- Editorial rewriting uses the Gemini free tier when `GEMINI_API_KEY` is present, or Hugging Face when `HF_TOKEN` is present.
- Without an AI key, the app still works: it creates a deterministic, source-attributed briefing instead of inventing content.
- CBS/Golazo video discovery uses YouTube's public RSS feed, so no YouTube key is required.
- Vercel invokes `/api/cron` daily. Its authorization header is added automatically from `CRON_SECRET`.

## Configuration

Copy `.env.example` to `.env.local` for local development. Never commit real secrets.

Required for deployment:

- `CRON_SECRET` (a random string of at least 16 characters)

Optional:

- `GEMINI_API_KEY` (preferred free AI provider) or `HF_TOKEN`
- `AI_MODEL` to override the default model
- Firebase Admin credentials for persistent Firestore storage; without them, Vercel's read-through data cache is used
- `FOOTBALL_DATA_API_KEY` or `FOOTBALL_API_KEY` to override the default TheSportsDB provider

`GET /api/health` reports which providers are configured without exposing secret values. Each scheduled run also stores its step-level outcome in `system/latest-refresh` in Firestore.

## Run

```bash
npm install
npm run dev
npm run build
```
