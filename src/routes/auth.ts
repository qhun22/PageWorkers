import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import type { Env, User } from '../types';
import { hashPassword } from '../utils/crypto';

export const authRouter = new Hono<Env>();

// Regex kiểm tra định dạng email hợp lệ
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. Đăng ký
authRouter.post('/register', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return c.json({ error: 'Vui lòng điền đủ email và password' }, 400);
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return c.json({ error: 'Email không đúng định dạng (ví dụ: user@example.com)' }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, 400);
  }

  const hash = await hashPassword(password);
  try {
    await c.env.DB.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .bind(normalizedEmail, hash)
      .run();
    return c.json({ message: 'Đăng ký tài khoản thành công' }, 201);
  } catch (err: any) {
    return c.json({ error: 'Email này đã tồn tại trong hệ thống' }, 400);
  }
});

// 2. Đăng nhập
authRouter.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return c.json({ error: 'Vui lòng điền đủ email và password' }, 400);
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return c.json({ error: 'Email không đúng định dạng' }, 400);
  }

  const hash = await hashPassword(password);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND password_hash = ?')
    .bind(normalizedEmail, hash)
    .first<User>();

  if (!user) {
    return c.json({ error: 'Email hoặc mật khẩu không chính xác' }, 401);
  }

  const token = await sign(
    {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 giờ
    },
    c.env.JWT_SECRET,
    'HS256'
  );

  return c.json({
    message: 'Đăng nhập thành công',
    token,
  });
});

// 3. Quên mật khẩu
authRouter.post('/forgot-password', async (c) => {
  const { email } = await c.req.json<{ email?: string }>();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return c.json({ error: 'Vui lòng cung cấp email' }, 400);
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return c.json({ error: 'Email không đúng định dạng' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first();

  if (!user) {
    return c.json({ error: 'Email không tồn tại trong hệ thống' }, 404);
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  await c.env.DB.prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)')
    .bind(normalizedEmail, token, expiresAt)
    .run();

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: normalizedEmail,
      subject: 'Mã xác nhận đặt lại mật khẩu',
      html: `
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Mã xác nhận của bạn là:</p>
        <p><strong>${token}</strong></p>
        <p>Mã này sẽ hết hạn sau 15 phút.</p>
      `,
    }),
  });

  if (!resendResponse.ok) {
    await c.env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run();
    return c.json({ error: 'Không thể gửi email đặt lại mật khẩu' }, 502);
  }

  return c.json({
    message: 'Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!',
  });
});

// 4. Đặt lại mật khẩu mới
authRouter.post('/reset-password', async (c) => {
  const { token, new_password } = await c.req.json<{ token?: string; new_password?: string }>();

  if (!token?.trim() || !new_password) {
    return c.json({ error: 'Vui lòng điền token và new_password' }, 400);
  }

  if (new_password.length < 6) {
    return c.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400);
  }

  const resetRecord = await c.env.DB.prepare(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime("now")'
  )
    .bind(token.trim())
    .first<{ email: string }>();

  if (!resetRecord) {
    return c.json({ error: 'Token không hợp lệ hoặc đã hết hạn' }, 400);
  }

  const newHash = await hashPassword(new_password);

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE email = ?').bind(newHash, resetRecord.email),
    c.env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token.trim()),
  ]);

  return c.json({ message: 'Đặt lại mật khẩu thành công' });
});