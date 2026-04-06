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
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? 'dev-only-change-in-production';

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(
  session({
    name: 'portfolio.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
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
