import Parser from 'rss-parser';

export interface ParsedArticle {
  title: string;
  description?: string;
  url: string;
  pubDate: Date;
  author?: string;
  imageUrl?: string;
  content?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

export async function parseRSSFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items
      .filter(item => item.link && item.title)
      .map(item => {
        // Extract image from various possible fields
        let imageUrl: string | undefined;
        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if ((item as any).mediaContent?.$ ?.url) {
          imageUrl = (item as any).mediaContent.$.url;
        } else if ((item as any).mediaThumbnail?.$ ?.url) {
          imageUrl = (item as any).mediaThumbnail.$.url;
        }

        // Extract content
        const content = (item as any).contentEncoded || item.content || undefined;

        return {
          title: item.title!,
          description: item.contentSnippet || item.summary || undefined,
          url: item.link!,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item.creator || item.author || undefined,
          imageUrl,
          content,
        };
      });
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    throw error;
  }
}
