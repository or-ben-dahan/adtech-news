# Ad-Tech Relevance Scoring System

## Overview

The news fetching system now uses a **relevance scoring algorithm** instead of strict keyword filtering. This ensures we always have quality content while prioritizing ad-tech related articles.

## Scoring Rules

Each article receives a score based on multiple factors:

### +2 Points: Title Contains Ad-Tech Keywords
- **Examples:** "advertising", "programmatic", "ad tech", "CTV", "DSP", "SSP"
- **Why:** Title keywords are the strongest signal of relevance

### +1 Point: Description Contains Ad-Tech Keywords
- **Examples:** Same keywords in article description/summary
- **Why:** Content relevance, even if title is generic

### +1 Point: Known Ad-Tech/Marketing Source
- **Sources:** AdExchanger, Digiday, Google Ads Blog, Google News (AdTech), Ad Age, Marketing Land, etc.
- **Why:** Industry publications are inherently relevant

## Filtering Logic

```javascript
// Keep articles with score >= 1
const relevantArticles = articles.filter(article => article.score >= 1);

// Fallback: If fewer than 10 articles pass, show latest 10 anyway
if (relevantArticles.length < 10) {
  relevantArticles = articles
    .sort(by newest date)
    .slice(0, 10);
}
```

## Sorting Priority

Articles are sorted by:
1. **Score** (highest first)
2. **Date** (newest first within same score)

This ensures the most relevant and recent articles appear first.

## Example Scores

| Article | Title Keywords | Description Keywords | Source | Total Score |
|---------|----------------|---------------------|---------|-------------|
| "Why Amazon Is Gaining Ground In CTV And The Trade Desk Is Losing Its Lead" | +2 (CTV, advertising) | +1 (advertising) | +1 (AdExchanger) | **4** |
| "Future of TV Briefing: Paramount's ad tech stacks" | +2 (ad tech) | +1 (ad tech) | +1 (Digiday) | **4** |
| "Reddit Accelerates AI Advertising Plans" | +2 (advertising) | +1 (advertising) | +1 (Google News) | **4** |
| "Digital Marketing Trends 2026" | 0 | 0 | +1 (Digiday) | **1** ✅ |
| "Apple Launches New iPhone" | 0 | 0 | 0 | **0** ❌ |

## Performance Metrics

From latest build:
- **Total articles fetched:** 135
- **Articles with score >= 1:** 126 (93.3%)
- **Final output:** 30 (top scored + newest)
- **Fallback triggered:** No (had 126 > 10)

## Ad-Tech Keywords (50+)

### Core Terms
- ad tech, adtech, advertising, advertisement, programmatic
- rtb, real-time bidding, header bidding
- demand-side, dsp, supply-side, ssp
- ad exchange, ad network, ad server

### Formats
- display ads, video ads, native ads, banner ads
- mobile ads, in-app ads, connected tv, ctv, ott

### MarTech
- martech, marketing tech, attribution
- ad targeting, audience, retargeting, remarketing

### Metrics
- cpm, cpc, cpa, ctr, viewability, brand safety
- ad fraud, verification, incrementality

### Privacy
- cookie, third-party cookie, privacy sandbox
- gdpr, ccpa, consent, data privacy

### Platforms
- google ads, facebook ads, meta ads, amazon ads
- retail media, trade desk, magnite, criteo

### Measurement
- measurement, analytics, conversion, roi, roas

## Benefits Over Strict Filtering

### Old System (Strict)
```javascript
articles.filter(article =>
  hasAdTechKeywords(article.title)
)
```
- ❌ Might return 0 articles
- ❌ Misses relevant articles with generic titles
- ❌ Ignores source authority
- ❌ All-or-nothing approach

### New System (Scoring)
```javascript
articles
  .map(article => ({
    ...article,
    score: calculateRelevanceScore(article)
  }))
  .filter(article => article.score >= 1)
  .sort((a, b) => b.score - a.score || b.date - a.date)
```
- ✅ Always returns articles (fallback)
- ✅ Considers multiple signals
- ✅ Prioritizes by relevance
- ✅ Graceful degradation

## Customization

### Adjust Minimum Score
```javascript
// More strict (only highly relevant)
const relevant = articles.filter(a => a.score >= 2);

// More lenient (include tangential content)
const relevant = articles.filter(a => a.score >= 0);
```

### Adjust Fallback Threshold
```javascript
// Ensure at least 20 articles
if (relevantArticles.length < 20) {
  relevantArticles = allArticles.slice(0, 20);
}
```

### Add More Sources
```javascript
const ADTECH_SOURCES = [
  'AdExchanger',
  'Digiday',
  'Your New Source', // Add here
];
```

### Add More Keywords
```javascript
const ADTECH_KEYWORDS = [
  // Add new terms
  'ad spend', 'media buying', 'performance marketing',
];
```

## Testing

```bash
# Fetch fresh data with current settings
npm run prefetch:news

# Check console output for metrics
# Look for:
# - Total articles fetched
# - Articles with score >= 1
# - Articles written to JSON
```

## Future Enhancements

- **ML-based scoring**: Train model on historical data
- **Content analysis**: Use NLP for deeper relevance
- **User feedback**: Learn from click patterns
- **Category tagging**: Auto-classify articles
- **Duplicate detection**: Beyond URL hash
- **Sentiment scoring**: Prioritize positive news

---

**Current Status:** ✅ Active and working
**Last Updated:** March 4, 2026
**Articles Generated:** 30 from 126 relevant (out of 135 total)
