# lmkEuroSoka

A personal European football briefing that refreshes itself every morning at 08:15 EAT. It runs in a zero-config mode by default: no football, YouTube, database, or AI key is required.

## What is automated

- The current dashboard uses ESPN's public soccer feeds for fixtures, results, tables, and badges. Domestic standings can fall back to a full TheSportsDB table if available.
- The fixture watchlist ranks followed clubs, rivalries, close table matchups, and Champions League knockout games. Women’s coverage includes the WSL, Liga F, and UWCL.
- Stories combine verified match data with source-linked club developments from recent Google News results. The live club desk works without an AI key.
- The Stats tab uses ESPN competition-season squad totals. Club-specific player details add minutes and other metrics when ESPN reports matching totals.
- Golazo uses the YouTube channel feed or the optional Data API and ranks eligible UCL Today panel uploads from the last 16 hours by lifetime views divided by hours since publication.
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
