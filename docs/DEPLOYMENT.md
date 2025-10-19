# Deployment Guide

Complete guide for deploying the Smart Product Filter POC to production.

---

## Vercel Deployment (Recommended)

Vercel offers seamless Next.js deployment with zero configuration.

### Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)
- HuggingFace API key

---

## Method 1: Vercel Dashboard (Easiest)

### Step 1: Push to Git

```bash
git add .
git commit -m "🚀 ready for deployment"
git push origin main
```

### Step 2: Import Project

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository
4. Click **"Import"**

### Step 3: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**

- Build Command: `pnpm build` (or leave default)
- Output Directory: `.next` (auto-detected)
- Install Command: `pnpm install`

**Root Directory:** `./` (leave as default)

### Step 4: Environment Variables

Click **"Environment Variables"** and add:

| Name                  | Value                | Environments                     |
| --------------------- | -------------------- | -------------------------------- |
| `HUGGINGFACE_API_KEY` | `hf_your_token_here` | Production, Preview, Development |

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait ~2 minutes for build
3. Get deployment URL: `https://your-project.vercel.app`

---

## Method 2: Vercel CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Add Environment Variable

```bash
vercel env add HUGGINGFACE_API_KEY
# Paste your token when prompted
# Select: Production, Preview, Development
```

---

## Method 3: Deploy Button

Add this to your README:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/smart-filters-poc&env=HUGGINGFACE_API_KEY)
```

Users can click to deploy their own copy.

---

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to project **Settings** → **Domains**
2. Add your domain: `smart-filters.yourdomain.com`
3. Update DNS:
   ```
   Type: CNAME
   Name: smart-filters
   Value: cname.vercel-dns.com
   ```

### Ignored Build Step

Prevent deployments for documentation changes:

1. Go to **Settings** → **Git**
2. Scroll to **"Ignored Build Step"**
3. Enable **"Override"**
4. Add command:

```bash
git diff --quiet HEAD~1 ':(exclude)*.md' ':(exclude)docs/' ':(exclude)README.md' ':(exclude).github/' ':(exclude)LICENSE'
```

This skips deployment if only docs changed.

### Environment Variables (Production)

Verify environment variables are set:

1. **Settings** → **Environment Variables**
2. Check `HUGGINGFACE_API_KEY` is present
3. Redeploy if needed: **Deployments** → **Redeploy**

---

## Vercel Settings

### Recommended Settings

**General:**

- Node.js Version: 20.x (or 18.x)
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output Directory: `.next`

**Git:**

- Production Branch: `main`
- Ignored Build Step: (see above)

**Functions:**

- Region: Auto (or nearest to users)
- Max Duration: 10s (Hobby) / 60s (Pro)

## Monitoring & Debugging

### Vercel Logs

View real-time logs:

1. Go to **Deployments**
2. Click on deployment
3. Click **"Runtime Logs"**

### Function Logs

API route logs visible in:

- Vercel Dashboard → Functions → `/api/smart-filter`
- Real-time logs during development

### Error Tracking

Add error tracking (optional):

```bash
pnpm add @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Performance Optimization

### Caching

Vercel automatically caches:

- Static assets (images, fonts)
- API responses (via headers)

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image src='/washer.jpg' width={300} height={200} alt='Washer' />;
```

### Bundle Size

Check bundle size:

```bash
pnpm build
# Look for "First Load JS" sizes
```

---

## Rollback Strategy

### Instant Rollback

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"⋯"** → **"Promote to Production"**

### Git Rollback

```bash
git revert HEAD
git push origin main
# Vercel auto-deploys
```

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env.local`
- ✅ Use Vercel dashboard for secrets
- ✅ Rotate API keys periodically
- ✅ Use `.env.example` for templates

### API Rate Limiting

Add rate limiting (optional):

```typescript
// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## Cost Estimation

### Vercel Hobby Plan (Free)

- Deployments: Unlimited
- Bandwidth: 100 GB/month
- Functions: 100 GB-hours/month
- Build time: 6000 minutes/month

**POC Usage:**

- Typical: $0/month (within free tier)
- Expected: < 1% of limits

### HuggingFace API (Free)

- Requests: ~1000/day
- Rate: 1 req/sec

**POC Usage:**

- Demo: < 100 requests/day
- Cost: $0

### Monitoring

- Check Vercel Analytics weekly
- Review error logs
- Monitor HuggingFace API usage
