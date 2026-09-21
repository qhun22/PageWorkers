import { Hono } from 'hono';
import type { Env, PublicUser } from '../types';
import { authMiddleware } from '../middlewares/auth';

export const userRouter = new Hono<Env>();

// Bảo vệ bằng middleware auth
userRouter.use('/me', authMiddleware);

// Trang index / profile sau khi đăng nhập thành công
userRouter.get('/me', async (c) => {
  const { userId } = c.get('jwtPayload');
  const user = await c.env.DB.prepare(
    'SELECT id, email, created_at FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<PublicUser>();

  if (!user) {
    return c.json({ error: 'Tài khoản không tồn tại' }, 404);
  }

  return c.json({ user });
});