import type { JWTPayload } from 'hono/utils/jwt/types';

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  VNPAY_URL?: string;
  VNPAY_TMN_CODE?: string;
  VNPAY_HASH_SECRET?: string;
  VNPAY_RETURN_URL?: string;
  MOMO_ENDPOINT?: string;
  MOMO_PARTNER_CODE?: string;
  MOMO_ACCESS_KEY?: string;
  MOMO_SECRET_KEY?: string;
  MOMO_RETURN_URL?: string;
};

export type AuthPayload = JWTPayload & {
  userId: number;
  email: string;
};

export type Env = {
  Bindings: Bindings;
  Variables: {
    jwtPayload: AuthPayload;
  };
};

export type User = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

export type PublicUser = Omit<User, 'password_hash'>;