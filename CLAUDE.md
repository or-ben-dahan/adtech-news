# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Start development server at localhost:3000
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

## Architecture

Next.js app with a client frontend and a server-side API backend. No database — state is persisted in a local JSON file.

### Data flow

```
app/page.tsx  →  GET /api/news  →  data/news.json (state file)
                                        ↑
                              fetch RSS feeds if stale
```

1. `app/page.tsx` is a client component that calls `GET /api/news` on mount.
2. `app/api/news/route.ts` is the only backend route. It:
   - Reads `data/news.json` — if last fetch was < 15 minutes ago, returns cached items.
   - Otherwise fetches all 5 RSS feeds in parallel, filters for adtech relevance, merges with existing items, prunes articles older than 30 days, writes the updated state back to `data/news.json`, and returns the result.
3. No cron job, no external scheduler — the API route self-refreshes on demand.

### State file (`data/news.json`)

```json
{
  "items": [{ "id", "title", "url", "source", "publishedAt" }],
  "lastFetchedAt": "<ISO timestamp>"
}
```

The `data/` directory is gitignored (runtime data). It is created automatically on first request.

### Adtech filtering

Articles are kept only if their title contains at least one keyword from `ADTECH_KEYWORDS` in `app/api/news/route.ts`. The keyword list covers core ad-tech terms, platforms, metrics, and privacy topics.

### Key files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Client UI — fetches `/api/news`, renders articles |
| `app/api/news/route.ts` | Backend — state management, RSS fetching, filtering |
| `types/news.ts` | Shared types: `NewsItem`, `NewsResponse`, `RSSFeed` |
| `data/news.json` | Runtime state (gitignored, auto-created) |

### RSS sources

Defined in `app/api/news/route.ts`: AdExchanger, Digiday, Google Ads Blog, The Verge, Google News (AdTech query).
