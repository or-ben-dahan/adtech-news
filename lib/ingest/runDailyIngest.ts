import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseRSSFeed, type ParsedArticle } from '@/lib/rss/parser';
import { RSS_SOURCES } from '@/lib/rss/sources';

function generateUrlHash(url: string): string {
  // Normalize URL to prevent duplicate entries for same content
  const normalizedUrl = url.trim().toLowerCase();
  return createHash('sha256').update(normalizedUrl).digest('hex');
}

interface IngestStats {
  articlesFound: number;
  articlesNew: number;
  articlesUpdated: number;
}

export async function runDailyIngest(): Promise<IngestStats> {
  const runId = await createIngestRun();
  const startTime = Date.now();

  try {
    console.log(`[Ingest ${runId}] Starting daily ingest from ${RSS_SOURCES.length} sources`);

    const stats: IngestStats = {
      articlesFound: 0,
      articlesNew: 0,
      articlesUpdated: 0,
    };

    // Fetch from all RSS sources
    for (const source of RSS_SOURCES) {
      try {
        console.log(`[Ingest ${runId}] Fetching from ${source.name}...`);
        const articles = await parseRSSFeed(source.url);

        console.log(`[Ingest ${runId}] Found ${articles.length} articles from ${source.name}`);
        stats.articlesFound += articles.length;

        // Process each article
        for (const article of articles) {
          const result = await upsertArticle(article, source.name);
          if (result === 'created') {
            stats.articlesNew++;
          } else if (result === 'updated') {
            stats.articlesUpdated++;
          }
        }
      } catch (error) {
        console.error(`[Ingest ${runId}] Error processing source ${source.name}:`, error);
        // Continue with other sources even if one fails
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Ingest ${runId}] Completed successfully in ${durationMs}ms`);
    console.log(`[Ingest ${runId}] Stats:`, stats);

    await completeIngestRun(runId, 'success', stats, durationMs);

    return stats;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[Ingest ${runId}] Failed:`, error);

    await completeIngestRun(runId, 'failed', {
      articlesFound: 0,
      articlesNew: 0,
      articlesUpdated: 0,
    }, durationMs, errorMessage);

    throw error;
  }
}

async function createIngestRun(): Promise<string> {
  const run = await prisma.ingestRun.create({
    data: {
      status: 'running',
    },
  });
  return run.id;
}

async function completeIngestRun(
  runId: string,
  status: 'success' | 'failed',
  stats: IngestStats,
  durationMs: number,
  error?: string
): Promise<void> {
  await prisma.ingestRun.update({
    where: { id: runId },
    data: {
      completedAt: new Date(),
      status,
      articlesFound: stats.articlesFound,
      articlesNew: stats.articlesNew,
      articlesUpdated: stats.articlesUpdated,
      durationMs,
      error,
    },
  });
}

async function upsertArticle(
  article: ParsedArticle,
  sourceName: string
): Promise<'created' | 'updated' | 'skipped'> {
  const urlHash = generateUrlHash(article.url);

  // Check if article exists
  const existing = await prisma.article.findUnique({
    where: { urlHash },
  });

  if (existing) {
    // Update if content has changed
    const hasChanges =
      existing.title !== article.title ||
      existing.description !== article.description ||
      existing.content !== article.content;

    if (hasChanges) {
      await prisma.article.update({
        where: { urlHash },
        data: {
          title: article.title,
          description: article.description,
          content: article.content,
          author: article.author,
          imageUrl: article.imageUrl,
          updatedAt: new Date(),
        },
      });
      return 'updated';
    }
    return 'skipped';
  }

  // Create new article
  await prisma.article.create({
    data: {
      title: article.title,
      description: article.description,
      url: article.url,
      urlHash,
      source: sourceName,
      pubDate: article.pubDate,
      author: article.author,
      imageUrl: article.imageUrl,
      content: article.content,
    },
  });

  return 'created';
}
