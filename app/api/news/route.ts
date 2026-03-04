import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import type { NewsItem, RSSFeed } from '@/types/news';

export const dynamic = 'force-dynamic';

const RSS_FEEDS: RSSFeed[] = [
  { name: 'AdExchanger', url: 'https://www.adexchanger.com/feed/' },
  { name: 'Digiday', url: 'https://digiday.com/feed/' },
  { name: 'Google Ads Blog', url: 'https://blog.google/products/ads/rss/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  {
    name: 'Google News (AdTech)',
    url: 'https://news.google.com/rss/search?q=adtech+OR+advertising+technology+OR+programmatic+advertising+OR+"ad+tech"&hl=en-US&gl=US&ceid=US:en'
  },
];

// In-memory cache
let cache: {
  data: NewsItem[] | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null,
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Ad-tech related keywords for filtering
const ADTECH_KEYWORDS = [
  // Core ad-tech terms
  'ad tech', 'adtech', 'advertising', 'advertisement', 'programmatic',
  'rtb', 'real-time bidding', 'header bidding', 'demand-side', 'dsp',
  'supply-side', 'ssp', 'ad exchange', 'ad network', 'ad server',

  // Digital advertising
  'digital ads', 'display ads', 'video ads', 'native ads', 'banner ads',
  'mobile ads', 'in-app ads', 'connected tv', 'ctv', 'ott',

  // Marketing tech
  'martech', 'marketing tech', 'attribution', 'ad targeting', 'audience',
  'retargeting', 'remarketing', 'lookalike', 'ad campaign',

  // Metrics & optimization
  'cpm', 'cpc', 'cpa', 'ctr', 'viewability', 'brand safety',
  'ad fraud', 'verification', 'incrementality',

  // Privacy & regulation
  'cookie', 'third-party cookie', 'privacy sandbox', 'gdpr', 'ccpa',
  'consent', 'data privacy', 'identity resolution',

  // Platforms & tech
  'google ads', 'facebook ads', 'meta ads', 'tiktok ads', 'amazon ads',
  'retail media', 'trade desk', 'magnite', 'pubmatic', 'criteo',
  'contextual', 'first-party data', 'data clean room',

  // Measurement
  'measurement', 'analytics', 'conversion', 'roi', 'roas',
  'media mix', 'attribution model',
];

function isAdTechRelated(article: NewsItem): boolean {
  const searchText = article.title.toLowerCase();
  return ADTECH_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}

function generateId(url: string, title?: string, date?: string): string {
  const input = url || `${title}-${date}`;
  return createHash('md5').update(input).digest('hex');
}

async function fetchFeed(feed: RSSFeed): Promise<NewsItem[]> {
  try {
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      },
    });

    const result = await parser.parseURL(feed.url);

    return result.items
      .filter(item => item.title)
      .map(item => {
        const url = item.link || item.guid || '';
        const publishedAt = item.pubDate || item.isoDate || new Date().toISOString();

        return {
          id: generateId(url, item.title, publishedAt),
          title: item.title!,
          url,
          source: feed.name,
          publishedAt,
        };
      });
  } catch (error) {
    console.error(`Error fetching feed ${feed.name}:`, error);
    // Return empty array on error - graceful degradation
    return [];
  }
}

async function fetchAllFeeds(): Promise<NewsItem[]> {
  // Fetch all feeds in parallel
  const feedPromises = RSS_FEEDS.map(feed => fetchFeed(feed));
  const feedResults = await Promise.all(feedPromises);

  // Flatten and merge all results
  const allItems = feedResults.flat();

  // Filter for ad-tech related articles only
  const adTechItems = allItems.filter(isAdTechRelated);

  console.log(`[News API] Filtered ${allItems.length} articles to ${adTechItems.length} ad-tech related articles`);

  // Sort by published date (newest first)
  adTechItems.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  // Return top 30
  return adTechItems.slice(0, 30);
}

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
    if (
      cache.data &&
      cache.timestamp &&
      now - cache.timestamp < CACHE_DURATION
    ) {
      console.log('[News API] Serving from cache');
      return NextResponse.json({
        items: cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
      });
    }

    // Fetch fresh data
    console.log('[News API] Fetching fresh data from RSS feeds');
    const items = await fetchAllFeeds();

    // Update cache
    cache = {
      data: items,
      timestamp: now,
    };

    return NextResponse.json({
      items,
      cached: false,
      fetchedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    console.error('[News API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
