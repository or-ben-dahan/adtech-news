# Daily Ingest Job Setup Guide

This guide covers the setup and configuration of the daily RSS ingestion system.

## 📁 Project Structure

```
adtech-news/
├── prisma/
│   └── schema.prisma              # Database schema with Articles & IngestRuns
├── lib/
│   ├── prisma.ts                  # Prisma client singleton
│   ├── rss/
│   │   ├── parser.ts              # RSS parser utility
│   │   └── sources.ts             # RSS feed sources configuration
│   └── ingest/
│       └── runDailyIngest.ts      # Main ingestion logic
├── app/
│   └── api/
│       └── cron/
│           └── ingest/
│               └── route.ts       # Protected cron endpoint
└── vercel.json                    # Vercel cron configuration
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma ORM
- `prisma` - Prisma CLI
- `rss-parser` - Lightweight RSS feed parser

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/adtech_news?schema=public"

# Generate a secure token: openssl rand -base64 32
CRON_SECRET="your-secure-random-token-here"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR create a migration (for production)
npm run db:migrate
```

### 4. Configure RSS Sources

Edit [lib/rss/sources.ts](lib/rss/sources.ts) to add/modify RSS feeds:

```typescript
export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'AdAge',
    url: 'https://adage.com/rss',
  },
  {
    name: 'AdExchanger',
    url: 'https://www.adexchanger.com/feed/',
  },
  // Add more sources...
];
```

## 🔒 API Route Authentication

The cron endpoint at `/api/cron/ingest` is protected with Bearer token authentication.

**Request format:**
```bash
curl https://your-domain.com/api/cron/ingest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## ⏰ Vercel Cron Configuration

The [vercel.json](vercel.json) configures a daily cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule:** Runs daily at 6:00 AM UTC

**Cron syntax:**
- `0 6 * * *` = Every day at 6:00 AM UTC
- `0 */6 * * *` = Every 6 hours
- `0 0 * * 0` = Every Sunday at midnight

### Vercel Setup

1. Deploy to Vercel
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `CRON_SECRET`
3. Cron job will automatically run on schedule

**Note:** Vercel Cron is only available on Pro and Enterprise plans. For Hobby tier, use external cron services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions

## 🧪 Manual Testing

Test the ingest job locally:

```typescript
// Create a test script: scripts/test-ingest.ts
import { runDailyIngest } from '@/lib/ingest/runDailyIngest';

async function test() {
  try {
    const stats = await runDailyIngest();
    console.log('Success:', stats);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

Or test the API endpoint:

```bash
# Set your CRON_SECRET in .env first
curl http://localhost:3000/api/cron/ingest \
  -H "Authorization: Bearer your-cron-secret-here"
```

## 📊 Database Schema

### Articles Table
- `id` - Unique identifier (CUID)
- `title` - Article title
- `description` - Article excerpt/summary
- `url` - Original article URL
- `urlHash` - SHA-256 hash for deduplication
- `source` - RSS source name
- `pubDate` - Publication date
- `author` - Article author
- `imageUrl` - Featured image URL
- `content` - Full article content
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp

### IngestRuns Table (Logging)
- `id` - Unique identifier
- `startedAt` - Run start time
- `completedAt` - Run completion time
- `status` - 'running', 'success', or 'failed'
- `articlesFound` - Total articles fetched
- `articlesNew` - New articles created
- `articlesUpdated` - Existing articles updated
- `error` - Error message (if failed)
- `durationMs` - Execution duration

## 🔄 How It Works

1. **Fetch:** Downloads RSS feeds from configured sources
2. **Parse:** Extracts article data (title, URL, description, etc.)
3. **Normalize:** Generates URL hash for deduplication
4. **Dedupe:** Checks if article already exists by `urlHash`
5. **Upsert:** Creates new articles or updates changed content
6. **Log:** Records run statistics in `IngestRuns` table

## 🛠️ Customization

### Add Custom Fields
Edit [prisma/schema.prisma](prisma/schema.prisma) and run:
```bash
npm run db:migrate
```

### Change Deduplication Logic
Edit [lib/ingest/runDailyIngest.ts](lib/ingest/runDailyIngest.ts), `generateUrlHash()` function.

### Modify Parser
Edit [lib/rss/parser.ts](lib/rss/parser.ts) to handle custom RSS fields.

## 📈 Monitoring

View ingest runs in your database:

```sql
SELECT * FROM ingest_runs ORDER BY started_at DESC LIMIT 10;
```

Or use Prisma Studio:

```bash
npm run db:studio
```

## 🐛 Troubleshooting

**Cron not running:**
- Check Vercel logs in dashboard
- Verify `CRON_SECRET` is set in Vercel environment variables
- Ensure you're on Vercel Pro/Enterprise plan

**Database connection errors:**
- Verify `DATABASE_URL` format
- Check database credentials
- Ensure database is accessible from Vercel

**RSS parsing failures:**
- Check feed URL is valid
- Verify feed returns valid XML
- Check console logs for specific errors

## 📝 Next Steps

1. Add article display UI
2. Implement search and filtering
3. Add categories/tags
4. Set up full-text search
5. Add email notifications for new articles
6. Implement rate limiting
7. Add article sentiment analysis
