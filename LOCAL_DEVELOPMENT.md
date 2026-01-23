# Local Development Guide

## Running with Authentication (Recommended)

To test authentication and database features locally, use Vercel CLI:

### 1. Install Vercel CLI (already done)
```bash
npm install
```

### 2. Link to Vercel Project (first time only)
```bash
npx vercel link
```
- Choose your Vercel account
- Link to existing project or create new one

### 3. Pull Environment Variables
```bash
npx vercel env pull .env.local
```
This downloads your production environment variables (POSTGRES_URL, etc.)

### 4. Run Development Server
```bash
npm run dev
```

This starts:
- ✅ Frontend on http://localhost:3000
- ✅ API routes at /api/*
- ✅ Postgres database connection
- ✅ Full authentication system

### 5. Test Authentication
1. Open http://localhost:3000
2. Click "Sign Up" tab
3. Enter email and password
4. Create account and login!

---

## Running Frontend Only (No Auth)

If you don't need authentication/database features:

```bash
npm run dev:frontend
```

This runs just the Vite dev server:
- ✅ Fast hot reload
- ✅ Frontend-only features
- ❌ No API routes
- ❌ No authentication
- ❌ No database

You'll see the login screen, but signup/login won't work.

---

## Troubleshooting

### "Network error" on signup/login
**Cause:** API routes not available
**Solution:** Use `npm run dev` (not `npm run dev:frontend`)

### "Database connection failed"
**Cause:** Missing environment variables
**Solution:** Run `npx vercel env pull .env.local`

### "Failed to link project"
**Cause:** Not logged into Vercel CLI
**Solution:** Run `npx vercel login`

### Port already in use
**Cause:** Another process using port 3000
**Solution:** Kill the process or Vercel will prompt for different port

---

## Environment Variables Needed

Create `.env.local` file (or pull from Vercel):

```env
# Postgres (required for auth and data persistence)
POSTGRES_URL="your-postgres-connection-string"
POSTGRES_PRISMA_URL="your-prisma-connection-string"
POSTGRES_URL_NON_POOLING="your-non-pooling-url"
POSTGRES_USER="your-user"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="your-database"

# Claude API (required for AI processing)
ANTHROPIC_API_KEY="your-api-key"

# Email (optional, for notifications)
RESEND_API_KEY="your-resend-key"
```

---

## Deployment

To deploy to production:

```bash
# Build locally (optional)
npm run build

# Deploy to Vercel
npx vercel --prod
```

Or push to main branch if connected to GitHub - Vercel auto-deploys!

---

## Quick Reference

| Command | Purpose | Auth Works? | DB Works? |
|---------|---------|-------------|-----------|
| `npm run dev` | Full dev (Vercel) | ✅ Yes | ✅ Yes |
| `npm run dev:frontend` | Frontend only | ❌ No | ❌ No |
| `npm run build` | Production build | - | - |
| `npm run preview` | Preview build | ❌ No | ❌ No |
| `npx vercel dev` | Same as npm run dev | ✅ Yes | ✅ Yes |
| `npx vercel --prod` | Deploy to production | ✅ Yes | ✅ Yes |

---

## First-Time Setup Checklist

- [ ] Install dependencies: `npm install`
- [ ] Login to Vercel: `npx vercel login`
- [ ] Link project: `npx vercel link`
- [ ] Pull env vars: `npx vercel env pull .env.local`
- [ ] Run dev server: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Create test account
- [ ] Test features!

---

## Common Issues

### Authentication works in production but not locally
- Make sure you're using `npm run dev` (not `dev:frontend`)
- Check `.env.local` exists and has valid Postgres credentials

### Data not persisting after restart
- Using frontend-only mode (`npm run dev:frontend`)
- Data stored in localStorage only (no backend)
- Switch to `npm run dev` for full persistence

### Slow API responses
- Vercel dev has some overhead for serverless function emulation
- Production is much faster
- Use `npm run dev:frontend` if you don't need API during development

---

## Need Help?

1. Check console for errors (F12 → Console)
2. Check Vercel CLI output for API errors
3. Verify environment variables are set
4. Try `npx vercel env pull .env.local` again
5. Clear localStorage and try again

Happy coding! 🚀
