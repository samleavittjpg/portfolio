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

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in server/.env (see server/.env.example)');
  process.exit(1);
}

const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

await mongoose.connect(MONGODB_URI);

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

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) {
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

app.listen(PORT, () => {
  console.log(`API & uploads: http://localhost:${PORT}`);
});
