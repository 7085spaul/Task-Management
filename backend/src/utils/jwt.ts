import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";

const ACCESS_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY || "7d") as SignOptions["expiresIn"];

export interface AccessPayload {
  userId: string;
  email: string;
}

export interface RefreshPayload {
  userId: string;
  jti: string;
}

// ✅ Access Token
export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

// ✅ Refresh Token
export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();

  const token = jwt.sign({ userId, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });

  return { token, jti };
}

// ✅ Verify Access Token
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

// ✅ Verify Refresh Token
export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}

// ✅ Convert expiry to Date
export function getRefreshTokenExpiry(): Date {
  const match = String(REFRESH_EXPIRY).match(/^(\d+)([smhd])$/);

  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const [, num, unit] = match;
  const n = parseInt(num, 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + n * multipliers[unit]);
}
