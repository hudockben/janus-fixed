# Janus Vercel Deployment Guide

## Quick Deploy

1. **Push to GitHub/GitLab**
   ```bash
   git push origin claude/fix-vercel-fetch-error-az9jx
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository

3. **Configure Environment Variables** (CRITICAL)
   - In Vercel dashboard, go to: Project Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = `your-api-key-here`
   - Apply to: Production, Preview, and Development

4. **Deploy**
   - Vercel will automatically build and deploy
   - Build command: `npm run build`
   - Output directory: `dist`

## Architecture

```
janus-fixed/
├── api/
│   └── process.js          # Serverless function at /api/process
├── src/
│   ├── App.jsx            # Main React component
│   └── main.jsx           # React entry point
├── vercel.json            # Vercel configuration
├── vite.config.js         # Vite build config
└── package.json
```

## API Endpoint

- **Local**: `http://localhost:5173/api/process`
- **Production**: `https://your-app.vercel.app/api/process`

## How It Works

1. Frontend (React + Vite) builds to static files in `/dist`
2. Vercel serves static files from `/dist`
3. API requests to `/api/process` are routed to serverless function
4. Serverless function proxies requests to Anthropic API with your API key

## Troubleshooting

### "Failed to fetch" error
- ✅ Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- ✅ Check API logs in Vercel dashboard (Functions tab)
- ✅ Ensure Google Sheets are publicly accessible or shared with "Anyone with link"

### Build failures
- Run `npm install` locally first
- Verify `package.json` dependencies are correct
- Check Vercel build logs for specific errors

### Google Sheets access denied
- Make sure sheets are shared: "Anyone with the link can view"
- Check Sheet URL format: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/...`

## Testing Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Set environment variable
export ANTHROPIC_API_KEY='your-key-here'
```

## Production Checklist

- [ ] `ANTHROPIC_API_KEY` set in Vercel
- [ ] Repository connected to Vercel
- [ ] Build succeeds locally (`npm run build`)
- [ ] Google Sheets are publicly accessible
- [ ] Test the deployed app with a sample sheet

## Features Working in Production

✅ Google Sheets CSV export (client-side fetch)
✅ Local file uploads
✅ Anthropic API processing (via serverless function)
✅ KPI visualizations
✅ Browser notifications
✅ Dark mode
✅ Export results (TXT/CSV/JSON)

## Notes

- Serverless function timeout: 30 seconds (configured in vercel.json)
- Memory limit: 1024MB (configured in vercel.json)
- Free tier limits: Check Vercel and Anthropic usage limits
