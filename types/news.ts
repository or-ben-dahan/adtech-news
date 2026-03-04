export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsResponse {
  items: NewsItem[];
  cached?: boolean;
  cachedAt?: string;
  fetchedAt?: string;
  error?: string;
  message?: string;
}

export interface RSSFeed {
  name: string;
  url: string;
}
