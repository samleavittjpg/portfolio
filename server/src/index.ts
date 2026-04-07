import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import session from 'express-session';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { uploadRouter } from './routes/upload.js';

function logStartup(msg: string, extra?: Record<string, unknown>) {
  const line = extra
    ? `[portfolio-server] ${msg} ${JSON.stringify(extra)}`
    : `[portfolio-server] ${msg}`;
  console.log(line);
}

async function main(): Promise<void> {
  logStartup('boot', {
    node: process.version,
    cwd: process.cwd(),
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
  });

  const PORT = Number(process.env.PORT) || 4000;
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error(
      '[portfolio-server] Missing MONGODB_URI. Set it in Render → Environment (runtime).'
    );
    process.exit(1);
  }

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('[portfolio-server] Could not create uploads dir:', err);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    logStartup('mongodb connected');
  } catch (err) {
    console.error(
      '[portfolio-server] MongoDB connection failed:',
      err instanceof Error ? err.stack ?? err.message : err
    );
    process.exit(1);
  }

  const app = express();
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const SESSION_SECRET =
    process.env.SESSION_SECRET ?? 'dev-only-change-in-production';

  const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  const extraCorsOrigins =
    process.env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const corsAllowed = new Set([...defaultCorsOrigins, ...extraCorsOrigins]);

  /** Dev: Vite may use 5174, 5175, … — allow any localhost port. Prod: only allowlist above. */
  const devLocalOrigin =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (process.env.NODE_ENV !== 'production' && devLocalOrigin.test(origin)) {
          cb(null, true);
          return;
        }
        if (corsAllowed.has(origin)) {
          cb(null, true);
          return;
        }
        cb(null, false);
      },
      credentials: true,
    })
  );

  const prod = process.env.NODE_ENV === 'production';
  app.use(
    session({
      name: 'portfolio.sid',
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        /* Vercel → Render: cross-site credentialed fetch needs None + Secure */
        sameSite: prod ? 'none' : 'lax',
        secure: prod,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api', uploadRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  };
  app.use(errorHandler);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, () => {
      logStartup('listening', { port: PORT });
      resolve();
    });
    server.on('error', reject);
  });
}

main().catch((err) => {
  console.error(
    '[portfolio-server] fatal:',
    err instanceof Error ? err.stack ?? err.message : err
  );
  process.exit(1);
});
