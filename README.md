# Portfolio (Vite + Express API)

## Frontend (this folder root)

```bash
npm install
npm run dev
```

Vite dev server proxies `/api` and `/uploads` to `http://127.0.0.1:4000` (see `vite.config.js`).

### API + site together (recommended)

From the repo root (after `npm install` here and in `server/`):

```bash
npm run dev:all
```

This runs the Express API and Vite in one terminal (`-k` stops both if one exits).

## Backend API (`server/`)

Express + MongoDB (Mongoose). Serves REST routes and stores uploaded files under `server/uploads/` (created at runtime; not committed).

```bash
cd server
npm install
copy .env.example .env   # Windows — then edit .env
# Set MONGODB_URI (local or Atlas), SESSION_SECRET, AUTH_USERNAME, AUTH_PASSWORD
npm run dev
```

Or production-style:

```bash
cd server
npm run build
npm start
```

### Environment (`server/.env`)

| Variable         | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `MONGODB_URI`    | e.g. Atlas `mongodb+srv://.../portfolio?...` |
| `PORT`           | Default `4000`                               |
| `SESSION_SECRET` | Random string for cookies                    |
| `AUTH_USERNAME`  | Dashboard login                              |
| `AUTH_PASSWORD`  | Dashboard login                              |

Never commit `server/.env`. Copy from `server/.env.example` on each machine.

## New machine checklist

1. Clone repo, `npm install` in repo root and in `server/`.
2. Create `server/.env` from `.env.example` with your Atlas URI and secrets.
3. Run both: from repo root `npm run dev:all`, or run `cd server && npm run dev` and `npm run dev` in two terminals.

Uploaded media lives in `server/uploads/` locally; sync between machines via your normal workflow or re-upload through the app.

### Bulk-upload files to production (Render)

The API stores files on disk and serves them at `/uploads/...`. After deploy, copy a folder of images/videos from your machine to the live API:

```bash
cd server
node scripts/bulk-upload.mjs https://YOUR-SERVICE.onrender.com "C:\path\to\your\media\folder"
```

This calls `POST /api/upload` for each file and writes **`upload-manifest.json`** in the current directory with `{ localPath, url, filename }`. In **Atlas → projects**, set each document’s **`coverAssetPath`** to the matching `url` (e.g. `/uploads/abc-uuid.jpg`).

**Render note:** free/ephemeral disks can lose files on restart; add a **persistent disk** or object storage (S3/R2) if uploads must survive long-term.

## Deploy: Vercel (frontend) + Render (API)

1. **Render** — Web Service, **Root Directory** `server`. Build: `npm install && npm run build`. Start: `npm start`.  
   Env: `MONGODB_URI`, `NODE_ENV=production`, `SESSION_SECRET`, `AUTH_*`, `CORS_ORIGINS` (your Vercel URLs, comma-separated, `https://`).

2. **Vercel** — Root `.`, build `npm run build`, output `dist`.  
   Env: `VITE_API_BASE_URL=https://YOUR-SERVICE.onrender.com` (no trailing slash). Redeploy after changing it.

3. **Atlas** — **Network Access** must allow your host (often `0.0.0.0/0` for PaaS like Render).
