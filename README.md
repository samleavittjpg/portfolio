# Portfolio (Vite + Express API)

## Frontend (this folder root)

```bash
npm install
npm run dev
```

Vite dev server proxies `/api` and `/uploads` to `http://127.0.0.1:4000` (see `vite.config.js`).

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
3. Run API: `cd server && npm run dev`.
4. Run site: from root `npm run dev`.

Uploaded media lives in `server/uploads/` locally; sync between machines via your normal workflow or re-upload through the app.
