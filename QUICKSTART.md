# Quick Start Guide

## Run the News Feed Locally

Follow these exact steps to get the app running:

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `rss-parser` - RSS feed parser
- `@prisma/client` & `prisma` - Database ORM (for future ingestion feature)

### 2. Start Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### 3. View the News Feed

Open your browser to:
```
http://localhost:3000
```

You should see:
- Latest 30 articles from 4 RSS sources
- Articles sorted by publish date (newest first)
- Clean, responsive UI with source names and timestamps

### 4. Test the API Directly

You can also test the API endpoint directly:

```bash
curl http://localhost:3000/api/news
```

Or visit in your browser:
```
http://localhost:3000/api/news
```

## How It Works

### API Route: `/api/news`

Located at: [app/api/news/route.ts](app/api/news/route.ts)

**Features:**
- Fetches from 4 RSS sources in parallel
- In-memory cache (15-minute TTL)
- Graceful error handling (skips failed feeds)
- Returns top 30 articles sorted by date
- MD5 hash-based stable IDs

**RSS Sources:**
1. AdExchanger - `https://www.adexchanger.com/feed/`
2. Digiday - `https://digiday.com/feed/`
3. Google Ads Blog - `https://blog.google/products/ads/rss/`
4. The Verge - `https://www.theverge.com/rss/index.xml`

**Response format:**
```json
{
  "items": [
    {
      "id": "abc123...",
      "title": "Article Title",
      "url": "https://...",
      "source": "AdExchanger",
      "publishedAt": "2026-03-04T10:30:00Z"
    }
  ],
  "cached": false,
  "fetchedAt": "2026-03-04T12:00:00Z"
}
```

### Homepage: `app/page.tsx`

Client-side component that:
- Fetches from `/api/news` on mount
- Displays articles in a clean list
- Shows relative timestamps ("2 hours ago")
- Links open in new tabs
- Handles loading and error states

### Caching Behavior

- **First request:** Fetches from all RSS feeds (~2-3 seconds)
- **Subsequent requests (within 15 min):** Instant response from cache
- **After 15 min:** Fresh fetch from RSS sources
- **Cache is per-server instance** (resets on restart)

## Build for Production

```bash
# Build the production bundle
npm run build

# Start production server
npm start
```

Production build at: **http://localhost:3000**

## Deploy to Vercel

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Troubleshooting

**Issue: RSS feeds not loading**
- Check your internet connection
- Some feeds may have rate limiting
- Check console for specific feed errors
- Failed feeds are skipped gracefully

**Issue: Build errors**
- Run `npm install` to ensure all dependencies are installed
- Check that you're using Node.js 18+

**Issue: Cache not working**
- Cache resets on server restart (normal behavior)
- In production, use Redis for persistent caching

**Issue: TypeScript errors**
- Run `npm run build` to check for type errors
- Ensure all dependencies are properly installed

## Next Steps

- ✅ RSS feed aggregation working
- ✅ Clean UI with Tailwind CSS
- ✅ In-memory caching (15 min)
- ⏳ Add search/filter functionality
- ⏳ Add categories/tags
- ⏳ Enable daily database ingestion (see [INGEST_SETUP.md](INGEST_SETUP.md))
- ⏳ Add user preferences
- ⏳ Email digest feature

## Customization

### Add More RSS Feeds

Edit [app/api/news/route.ts](app/api/news/route.ts):

```typescript
const RSS_FEEDS: RSSFeed[] = [
  { name: 'AdExchanger', url: 'https://www.adexchanger.com/feed/' },
  { name: 'Digiday', url: 'https://digiday.com/feed/' },
  // Add your feeds here:
  { name: 'Your Source', url: 'https://example.com/feed.xml' },
];
```

### Change Cache Duration

Edit the `CACHE_DURATION` constant:

```typescript
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
```

### Modify Article Count

Change the slice value:

```typescript
return allItems.slice(0, 50); // Return top 50 instead of 30
```

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database (for future ingestion feature)
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio
```
