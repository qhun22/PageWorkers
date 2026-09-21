import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { Env, AuthPayload } from '../types';

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Chưa đăng nhập (thiếu Bearer token)' }, 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return c.json({ error: 'Chưa đăng nhập (thiếu Bearer token)' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (typeof payload.userId !== 'number' || typeof payload.email !== 'string') {
      return c.json({ error: 'Token không hợp lệ hoặc đã hết hạn' }, 401);
    }

    c.set('jwtPayload', payload as AuthPayload);
    await next();
  } catch {
    return c.json({ error: 'Token không hợp lệ hoặc đã hết hạn' }, 401);
  }
});