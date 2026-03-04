# GitHub Pages Deployment Guide

## 🚀 Deployment Setup Complete

Your Next.js app has been converted to a static site ready for GitHub Pages deployment.

## 📋 What Was Changed

### 1. **Static Export Configuration** ([next.config.ts](next.config.ts))
```typescript
{
  output: "export",
  basePath: "/adtech-news",
  assetPrefix: "/adtech-news/",
  images: { unoptimized: true }
}
```

### 2. **Build-Time News Fetcher** ([scripts/fetch-news.mjs](scripts/fetch-news.mjs))
- Fetches RSS feeds at build time
- Applies ad-tech keyword filtering
- Generates `public/news.json` with top 30 articles

### 3. **Updated Homepage** ([app/page.tsx](app/page.tsx))
- Reads from `/adtech-news/news.json` instead of API route
- Works with static JSON data

### 4. **Package.json Scripts** ([package.json](package.json))
- `prefetch:news` - Fetches RSS data
- `build` - Runs prefetch then Next.js build

### 5. **GitHub Actions Workflow** ([.github/workflows/pages.yml](.github/workflows/pages.yml))
- Triggers on push to `main`
- Fetches news data
- Builds static site
- Deploys to GitHub Pages

## 🔧 Local Testing

Test the static build locally:

```bash
# Fetch news data
npm run prefetch:news

# Build static site
npm run build

# Serve the out directory
npx serve out
```

Visit: http://localhost:3000

## 📦 Deployment Process

### Initial Setup

1. **Create GitHub repository** (if not already created):
   ```bash
   # On GitHub.com, create a new repo named "adtech-news"
   ```

2. **Enable GitHub Pages in repository settings**:
   - Go to: Settings → Pages
   - Source: **GitHub Actions**
   - Save

3. **Push your code** (see commands below)

### Automatic Deployment

Once pushed, GitHub Actions will:
1. Install dependencies
2. Run `npm run prefetch:news` to fetch RSS data
3. Run `npm run build` to create static site
4. Deploy `./out` directory to GitHub Pages

### Your Site URL

```
https://or-ben-dahan.github.io/adtech-news/
```

## 🔄 Updating Content

The news data is fetched at **build time**, so to update:

**Option 1: Push to main**
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

**Option 2: Manual workflow trigger**
- Go to Actions tab
- Select "Deploy to GitHub Pages"
- Click "Run workflow"

**Option 3: Schedule automated rebuilds**
Add to `.github/workflows/pages.yml`:
```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

## 📁 File Structure

```
adtech-news/
├── .github/
│   └── workflows/
│       └── pages.yml          # GitHub Actions workflow
├── scripts/
│   └── fetch-news.mjs         # Build-time news fetcher
├── public/
│   ├── .nojekyll              # Disable Jekyll
│   └── news.json              # Generated at build time
├── app/
│   └── page.tsx               # Reads from news.json
├── next.config.ts             # Static export config
└── out/                       # Generated static site (gitignored)
```

## 🐛 Troubleshooting

### Build fails on GitHub Actions

**Check the Actions tab** for error logs:
- Go to repository → Actions
- Click the failed workflow
- Review error messages

Common issues:
- RSS feed timeout → Increase timeout in `fetch-news.mjs`
- Node version mismatch → Update `.github/workflows/pages.yml`

### 404 Error on GitHub Pages

1. Verify GitHub Pages is enabled (Settings → Pages)
2. Ensure source is set to "GitHub Actions"
3. Check workflow completed successfully
4. Wait 2-3 minutes after deployment

### Assets not loading

- Verify `basePath: "/adtech-news"` matches repo name
- Check browser console for 404s
- Ensure all links use relative paths

### News data not updating

- Rebuild triggers new RSS fetch
- Check `public/news.json` was generated
- Verify `generatedAt` timestamp in JSON

## 🎯 Production Checklist

- [x] Static export configured
- [x] Build-time news generation
- [x] GitHub Actions workflow created
- [x] basePath matches repository name
- [ ] GitHub Pages enabled in repo settings
- [ ] Code pushed to main branch
- [ ] Workflow runs successfully
- [ ] Site accessible at URL

## 🔐 Environment Variables

No environment variables needed for GitHub Pages deployment!

All RSS feeds are public and fetched at build time.

## 📊 Monitoring

### Check Build Status
```
https://github.com/or-ben-dahan/adtech-news/actions
```

### View Deployed Site
```
https://or-ben-dahan.github.io/adtech-news/
```

### Check Build Logs
- Actions tab → Latest workflow run → build job

## 🚀 Next Steps After Deployment

1. **Custom Domain** (optional):
   - Add CNAME file to `public/` directory
   - Configure DNS settings
   - Update in GitHub Pages settings

2. **Analytics**:
   - Add Google Analytics to `app/layout.tsx`
   - Use Vercel Analytics (if deploying there instead)

3. **SEO**:
   - Add meta tags to `app/layout.tsx`
   - Create `app/robots.txt`
   - Generate sitemap

4. **Scheduled Rebuilds**:
   - Add cron schedule to workflow
   - Set up webhook triggers
   - Use external cron services

## 📝 Notes

- **No API routes**: GitHub Pages is static-only
- **Build-time data**: News fetched during build, not at runtime
- **Manual updates**: Push to trigger rebuild with fresh data
- **Free hosting**: GitHub Pages is free for public repos
- **Custom workflows**: Modify `.github/workflows/pages.yml` as needed

---

**Ready to deploy?** See exact commands in the main README or console output.
