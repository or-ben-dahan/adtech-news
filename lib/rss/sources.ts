export interface RSSSource {
  name: string;
  url: string;
}

// Configure your RSS sources here
export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'AdAge',
    url: 'https://adage.com/rss',
  },
  {
    name: 'AdExchanger',
    url: 'https://www.adexchanger.com/feed/',
  },
  {
    name: 'Marketing Land',
    url: 'https://marketingland.com/feed',
  },
  {
    name: 'The Drum',
    url: 'https://www.thedrum.com/rss/feed',
  },
  // Add more adtech/marketing RSS feeds as needed
];
