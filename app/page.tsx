'use client';

import { useEffect, useState } from 'react';
import type { NewsItem } from '@/types/news';

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const response = await fetch('/api/news');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        setNews(data.items);
        setLastFetchedAt(data.lastFetchedAt);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AdTech News Intelligence
          </h1>
          <p className="text-gray-600">
            Latest news from top adtech and marketing sources
          </p>
          {lastFetchedAt && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(lastFetchedAt)}
            </p>
          )}
        </header>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-600">
              Loading latest news...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No news articles found.</p>
          </div>
        )}

        {!loading && news.length > 0 && (
          <div className="space-y-4">
            {news.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h2>
                </a>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-blue-600">
                    {item.source}
                  </span>
                  <span className="text-gray-400">•</span>
                  <time dateTime={item.publishedAt}>
                    {formatDate(item.publishedAt)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            Aggregating news from AdExchanger, Digiday, Google Ads Blog, Google News, and The Verge
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Filtered for ad-tech related content only
          </p>
        </footer>
      </div>
    </main>
  );
}