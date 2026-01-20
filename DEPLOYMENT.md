# Deployment Guide for Vercel

This proxy is configured to run in the **Frankfurt, Germany (fra1)** region to ensure it has a European IP address. This is important for accessing Slovak OGC services that may use geo-blocking.

## 1. Prerequisites
- A [Vercel](https://vercel.com) account.
- [Vercel CLI](https://vercel.com/cli) installed (optional).

## 2. Deployment Steps

### Option A: via GitHub (Recommended)
1. Push this repository to your GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** -> **"Project"**.
3. Import your repository.
4. In the **"Environment Variables"** section, add:
   - `PROXY_AUTH_KEY`: set this to your strong secret (e.g., `VASE_VELMI_SILNE_HESLO_TU`).
5. Click **"Deploy"**.

### Option B: via Vercel CLI
1. Run `vercel login` and follow the instructions.
2. Run `vercel link` to link the project.
3. Add the secret: `vercel env add PROXY_AUTH_KEY` (select production/preview/development).
4. Run `vercel --prod` to deploy.

## 3. How to use the Proxy

The proxy is available at the root of your deployment URL.

**Endpoint:** `https://your-project.vercel.app/?url=TARGET_URL`

**Required Header:**
- `X-Proxy-Auth`: Your `PROXY_AUTH_KEY`

### Example with `curl`:
```bash
curl -H "X-Proxy-Auth: your_secret_here" "https://your-project.vercel.app/?url=https://inspirews.skgeodesy.sk/..."
```

## 4. Security Note
- The `PROXY_AUTH_KEY` should be set in **Vercel Project Settings -> Environment Variables**.
- **Do NOT** put the secret directly in the code or commit it to GitHub (keep `.env` in `.gitignore`).
- If you are using GitHub Actions to trigger deployments, you can also manage secrets there, but Vercel's own Environment Variables UI is the most direct way for the runtime to see them.
