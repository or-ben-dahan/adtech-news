import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';

const RSS_FEEDS = [
  { name: 'AdExchanger', url: 'https://www.adexchanger.com/feed/' },
  { name: 'Digiday', url: 'https://digiday.com/feed/' },
  { name: 'Google Ads Blog', url: 'https://blog.google/products/ads/rss/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  {
    name: 'Google News (AdTech)',
    url: 'https://news.google.com/rss/search?q=adtech+OR+advertising+technology+OR+programmatic+advertising+OR+"ad+tech"&hl=en-US&gl=US&ceid=US:en'
  },
];

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

function generateId(url, title, date) {
  const input = url || `${title}-${date}`;
  return createHash('md5').update(input).digest('hex');
}

function isAdTechRelated(title) {
  const searchText = title.toLowerCase();
  return ADTECH_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}

async function fetchFeed(feed) {
  try {
    console.log(`[Fetch News] Fetching from ${feed.name}...`);

    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      },
    });

    const result = await parser.parseURL(feed.url);

    const items = result.items
      .filter(item => item.title)
      .map(item => {
        const url = item.link || item.guid || '';
        const publishedAt = item.pubDate || item.isoDate || new Date().toISOString();

        return {
          id: generateId(url, item.title, publishedAt),
          title: item.title,
          url,
          source: feed.name,
          publishedAt,
        };
      });

    console.log(`[Fetch News] Found ${items.length} articles from ${feed.name}`);
    return items;
  } catch (error) {
    console.error(`[Fetch News] Error fetching ${feed.name}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('[Fetch News] Starting RSS fetch for build-time generation...');

  try {
    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchFeed(feed));
    const feedResults = await Promise.all(feedPromises);

    // Flatten and merge all results
    const allItems = feedResults.flat();
    console.log(`[Fetch News] Total articles fetched: ${allItems.length}`);

    // Filter for ad-tech related articles
    const adTechItems = allItems.filter(item => isAdTechRelated(item.title));
    console.log(`[Fetch News] Filtered to ${adTechItems.length} ad-tech related articles`);

    // Deduplicate by ID
    const uniqueItems = Array.from(
      new Map(adTechItems.map(item => [item.id, item])).values()
    );
    console.log(`[Fetch News] After deduplication: ${uniqueItems.length} unique articles`);

    // Sort by published date (newest first)
    uniqueItems.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    // Take top 30
    const top30 = uniqueItems.slice(0, 30);

    // Write to public/news.json
    const outputPath = join(process.cwd(), 'public', 'news.json');
    const outputData = {
      items: top30,
      generatedAt: new Date().toISOString(),
      totalSources: RSS_FEEDS.length,
    };

    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`[Fetch News] Successfully wrote ${top30.length} articles to public/news.json`);
    console.log(`[Fetch News] Generated at: ${outputData.generatedAt}`);
  } catch (error) {
    console.error('[Fetch News] Fatal error:', error);
    process.exit(1);
  }
}

main();
