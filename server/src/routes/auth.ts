import { Router } from 'express';

const AUTH_USERNAME = process.env.AUTH_USERNAME ?? '1337';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? 'password';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const raw = req.body as { username?: unknown; password?: unknown };
  const username =
    typeof raw.username === 'string' ? raw.username.trim() : '';
  const password =
    typeof raw.password === 'string' ? raw.password : '';

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    req.session.user = { username: AUTH_USERNAME };
    res.json({ user: req.session.user });
    return;
  }

  res.status(401).json({ message: 'Invalid username or password' });
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: 'Could not log out' });
      return;
    }
    res.clearCookie('portfolio.sid');
    res.json({ ok: true });
  });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.session.user ?? null });
});
