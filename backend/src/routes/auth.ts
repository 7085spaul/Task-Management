import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { registerSchema, loginSchema } from '../validators/auth';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: { email: ['Email already registered'] } });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const { token: refreshToken, jti } = signRefreshToken(user.id);
    const expiresAt = getRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt },
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const { token: refreshToken, jti } = signRefreshToken(user.id);
    const expiresAt = getRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt },
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken ?? req.headers['x-refresh-token'];
    if (!token) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!stored || stored.userId !== payload.userId || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    res.json({ accessToken, expiresIn: 900 });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken ?? req.headers['x-refresh-token'];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
    } catch {
      // ignore invalid token
    }
  }
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  res.json({ message: 'Logged out' });
});

export default router;
