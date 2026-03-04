import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { NewsItem, RSSFeed } from '@/types/news';

export const dynamic = 'force-dynamic';

const RSS_FEEDS: RSSFeed[] = [
  { name: 'AdExchanger', url: 'https://www.adexchanger.com/feed/' },
  { name: 'Digiday', url: 'https://digiday.com/feed/' },
  { name: 'Google Ads Blog', url: 'https://blog.google/products/ads/rss/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  {
    name: 'Google News (AdTech)',
    url: 'https://news.google.com/rss/search?q=adtech+OR+advertising+technology+OR+programmatic+advertising+OR+"ad+tech"&hl=en-US&gl=US&ceid=US:en',
  },
];

const STATE_FILE = join(process.cwd(), 'data', 'news.json');
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface NewsState {
  items: NewsItem[];
  lastFetchedAt: string;
}

const ADTECH_KEYWORDS = [
  'ad tech', 'adtech', 'advertising', 'advertisement', 'programmatic',
  'rtb', 'real-time bidding', 'header bidding', 'demand-side', 'dsp',
  'supply-side', 'ssp', 'ad exchange', 'ad network', 'ad server',
  'digital ads', 'display ads', 'video ads', 'native ads', 'banner ads',
  'mobile ads', 'in-app ads', 'connected tv', 'ctv', 'ott',
  'martech', 'marketing tech', 'attribution', 'ad targeting', 'audience',
  'retargeting', 'remarketing', 'lookalike', 'ad campaign',
  'cpm', 'cpc', 'cpa', 'ctr', 'viewability', 'brand safety',
  'ad fraud', 'verification', 'incrementality',
  'cookie', 'third-party cookie', 'privacy sandbox', 'gdpr', 'ccpa',
  'consent', 'data privacy', 'identity resolution',
  'google ads', 'facebook ads', 'meta ads', 'tiktok ads', 'amazon ads',
  'retail media', 'trade desk', 'magnite', 'pubmatic', 'criteo',
  'contextual', 'first-party data', 'data clean room',
  'measurement', 'analytics', 'conversion', 'roi', 'roas',
  'media mix', 'attribution model',
];

function isAdTechRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return ADTECH_KEYWORDS.some(kw => lower.includes(kw));
}

function generateId(url: string, title?: string, date?: string): string {
  const input = url || `${title}-${date}`;
  return createHash('md5').update(input).digest('hex');
}

function readState(): NewsState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8')) as NewsState;
  } catch {
    return null;
  }
}

function writeState(state: NewsState): void {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function pruneOldArticles(items: NewsItem[]): NewsItem[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return items.filter(item => new Date(item.publishedAt).getTime() > cutoff);
}

async function fetchFeed(feed: RSSFeed): Promise<NewsItem[]> {
  try {
    const parser = new Parser({
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)' },
    });

    const result = await parser.parseURL(feed.url);

    return result.items
      .filter(item => item.title)
      .map(item => ({
        id: generateId(item.link || item.guid || '', item.title, item.pubDate),
        title: item.title!,
        url: item.link || item.guid || '',
        source: feed.name,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      }));
  } catch (error) {
    console.error(`[News API] Error fetching ${feed.name}:`, error);
    return [];
  }
}

async function fetchAllFeeds(): Promise<NewsItem[]> {
  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
  const all = results.flat();

  const filtered = all.filter(item => isAdTechRelated(item.title));
  console.log(`[News API] Filtered ${all.length} articles to ${filtered.length} adtech-related`);

  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return filtered;
}

export async function GET() {
  try {
    const state = readState();
    const now = Date.now();

    if (state && now - new Date(state.lastFetchedAt).getTime() < CACHE_DURATION) {
      console.log('[News API] Serving from cache');
      return NextResponse.json({ items: state.items, cached: true, lastFetchedAt: state.lastFetchedAt });
    }

    console.log('[News API] Fetching fresh data from RSS feeds');
    const freshItems = await fetchAllFeeds();

    // Merge: keep existing items not in the fresh batch (avoids losing older-but-valid articles)
    const existingItems = state?.items ?? [];
    const freshIds = new Set(freshItems.map(i => i.id));
    const retained = existingItems.filter(i => !freshIds.has(i.id));

    const merged = pruneOldArticles([...freshItems, ...retained]);
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const newState: NewsState = { items: merged, lastFetchedAt: new Date(now).toISOString() };
    writeState(newState);

    return NextResponse.json({ items: merged, cached: false, lastFetchedAt: newState.lastFetchedAt });
  } catch (error) {
    console.error('[News API] Error:', error);
    // Fall back to stale cache rather than returning an error
    const state = readState();
    if (state) {
      return NextResponse.json({ items: state.items, cached: true, stale: true, lastFetchedAt: state.lastFetchedAt });
    }
    return NextResponse.json(
      { error: 'Failed to fetch news', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}