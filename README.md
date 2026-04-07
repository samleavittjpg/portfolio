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
| `CORS_ORIGINS`   | Split deploy: your Vercel URL(s), comma-separated |

Never commit `server/.env`. Copy from `server/.env.example` on each machine.

## Deploy: Vercel (frontend) + Render (API)

1. **Render** — New **Web Service**, connect this repo, set **Root Directory** to `server`.  
   - **Build:** `npm install && npm run build`  
   - **Start:** `npm start`  
   - **Env:** `MONGODB_URI`, `SESSION_SECRET`, `AUTH_*`, `NODE_ENV=production`, and  
     `CORS_ORIGINS=https://YOUR-APP.vercel.app` (add preview URLs if you use them).  
   - **Disk:** free tier filesystem is ephemeral; uploads may be lost on restart. Add a **persistent disk** on Render or move uploads to S3/R2 later.

2. **Vercel** — Import this repo, **Root Directory** = `.` (repo root).  
   - **Build:** `npm run build` (default `vite build`)  
   - **Output:** `dist`  
   - **Env:** `VITE_API_BASE_URL=https://YOUR-SERVICE.onrender.com` (no trailing slash).

3. Local dev: leave `VITE_API_BASE_URL` unset so Vite proxies `/api` and `/uploads` to port 4000.

## New machine checklist

1. Clone repo, `npm install` in repo root and in `server/`.
2. Create `server/.env` from `.env.example` with your Atlas URI and secrets.
3. Run both: from repo root `npm run dev:all`, or run `cd server && npm run dev` and `npm run dev` in two terminals.

Uploaded media lives in `server/uploads/` locally; sync between machines via your normal workflow or re-upload through the app.
