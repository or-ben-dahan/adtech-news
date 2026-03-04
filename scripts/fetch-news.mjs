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

// Known adtech/marketing sources
const ADTECH_SOURCES = [
  'AdExchanger',
  'Digiday',
  'Google Ads Blog',
  'Google News (AdTech)',
  'Ad Age',
  'Marketing Land',
  'Marketing Brew',
  'AdWeek',
  'The Drum',
  'MarTech',
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

function hasAdTechKeywords(text) {
  if (!text) return false;
  const searchText = text.toLowerCase();
  return ADTECH_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}

function calculateRelevanceScore(article) {
  let score = 0;

  // +2 points if title contains adtech keywords
  if (hasAdTechKeywords(article.title)) {
    score += 2;
  }

  // +1 point if description contains adtech keywords
  if (hasAdTechKeywords(article.description)) {
    score += 1;
  }

  // +1 point if source is known adtech/marketing media
  if (ADTECH_SOURCES.includes(article.source)) {
    score += 1;
  }

  return score;
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
        const description = item.contentSnippet || item.summary || item.description || '';

        return {
          id: generateId(url, item.title, publishedAt),
          title: item.title,
          description,
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

    // Deduplicate by ID first
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id, item])).values()
    );
    console.log(`[Fetch News] After deduplication: ${uniqueItems.length} unique articles`);

    // Calculate relevance score for each article
    const scoredItems = uniqueItems.map(item => ({
      ...item,
      score: calculateRelevanceScore(item),
    }));

    // Filter articles with score >= 1
    let relevantItems = scoredItems.filter(item => item.score >= 1);
    console.log(`[Fetch News] Articles with score >= 1: ${relevantItems.length}`);

    // Fallback: if fewer than 10 articles, take latest 10 from all items
    if (relevantItems.length < 10) {
      console.log('[Fetch News] Fewer than 10 relevant articles, using fallback: latest 10 articles');
      relevantItems = scoredItems
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 10);
    }

    // Sort by score first (highest score first), then by date (newest first)
    relevantItems.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Take top 30
    const top30 = relevantItems.slice(0, 30);

    // Remove score from final output (internal use only)
    const finalItems = top30.map(({ score, ...item }) => item);

    // Write to public/news.json
    const outputPath = join(process.cwd(), 'public', 'news.json');
    const outputData = {
      items: finalItems,
      generatedAt: new Date().toISOString(),
      totalSources: RSS_FEEDS.length,
    };

    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`[Fetch News] Successfully wrote ${finalItems.length} articles to public/news.json`);
    console.log(`[Fetch News] Generated at: ${outputData.generatedAt}`);
  } catch (error) {
    console.error('[Fetch News] Fatal error:', error);
    process.exit(1);
  }
}

main();
