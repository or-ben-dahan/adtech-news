# Exact Commands for GitHub Pages Deployment

## ✅ Prerequisites

1. **GitHub account** signed in
2. **Repository created**: `or-ben-dahan/adtech-news` on GitHub.com
3. **GitHub Pages enabled** in repository settings:
   - Go to: https://github.com/or-ben-dahan/adtech-news/settings/pages
   - Under "Build and deployment"
   - Source: Select **"GitHub Actions"**
   - Click Save

## 📋 Exact Commands to Run

### Step 1: Initialize Git (if not already done)

```bash
cd /Users/Nour/Desktop/adtech-news
git init
```

### Step 2: Add Remote Repository

```bash
git remote add origin https://github.com/or-ben-dahan/adtech-news.git
```

**Or if using SSH:**
```bash
git remote add origin git@github.com:or-ben-dahan/adtech-news.git
```

### Step 3: Stage All Files

```bash
git add -A
```

### Step 4: Commit Changes

```bash
git commit -m "Initial commit: Static site for GitHub Pages deployment"
```

### Step 5: Rename Branch to Main (if needed)

```bash
git branch -M main
```

### Step 6: Push to GitHub

```bash
git push -u origin main
```

## 🎯 What Happens Next

1. **Push triggers GitHub Actions** workflow automatically
2. **Workflow runs**:
   - Installs Node.js dependencies
   - Runs `npm run prefetch:news` to fetch RSS data
   - Runs `npm run build` to create static site
   - Uploads `./out` directory
   - Deploys to GitHub Pages

3. **Site goes live** at:
   ```
   https://or-ben-dahan.github.io/adtech-news/
   ```

## 📊 Monitor Deployment

### Check Workflow Status

```bash
# Open in browser:
https://github.com/or-ben-dahan/adtech-news/actions
```

**Or use GitHub CLI:**
```bash
gh run list
gh run watch
```

### View Logs

1. Go to Actions tab on GitHub
2. Click on the latest workflow run
3. Click "build" job to see logs
4. Check for any errors

## ✅ Verify Deployment

Once workflow completes (2-3 minutes):

```bash
# Open your deployed site:
https://or-ben-dahan.github.io/adtech-news/
```

You should see:
- ✅ AdTech News Intelligence homepage
- ✅ 30 filtered ad-tech articles
- ✅ Source names and publish dates
- ✅ Clickable article links

## 🔄 Update Content Later

To fetch fresh news and rebuild:

```bash
# Make a dummy change or use empty commit
git commit --allow-empty -m "Trigger rebuild with fresh news"
git push origin main
```

## 🐛 If Something Goes Wrong

### Repository already exists error

```bash
# Remove old remote and add new one
git remote remove origin
git remote add origin https://github.com/or-ben-dahan/adtech-news.git
git push -u origin main
```

### Permission denied error

```bash
# Make sure you're logged into GitHub
gh auth login

# Or configure SSH keys
# See: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Build fails in GitHub Actions

1. Check Actions tab for error logs
2. Common issues:
   - RSS feed timeout → Will retry on next push
   - Node version mismatch → Workflow uses Node 20
   - Missing dependencies → Verify package.json

3. Fix and repush:
```bash
# Fix the issue, then:
git add .
git commit -m "Fix build issue"
git push origin main
```

## 📝 Summary of Commands

```bash
# Full sequence (copy-paste this entire block):
cd /Users/Nour/Desktop/adtech-news
git init
git remote add origin https://github.com/or-ben-dahan/adtech-news.git
git add -A
git commit -m "Initial commit: Static site for GitHub Pages deployment"
git branch -M main
git push -u origin main
```

## 🎉 Success Checklist

After running the commands above:

- [ ] All files pushed to GitHub
- [ ] GitHub Actions workflow started
- [ ] Workflow completed successfully (green checkmark)
- [ ] Site accessible at https://or-ben-dahan.github.io/adtech-news/
- [ ] News articles displaying correctly
- [ ] Links working properly

---

**That's it!** Your site will be live at:
### https://or-ben-dahan.github.io/adtech-news/
