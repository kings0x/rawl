import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export type AccessTokenClaims = {
  sub: string;
  email: string;
  isPremium: boolean;
  premiumTier: "BUILDER" | "INTELLIGENCE" | null;
};

export type RefreshTokenClaims = {
  sub: string;
  tokenType: "refresh";
};

export const signAccessToken = (claims: AccessTokenClaims) =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const signRefreshToken = (claims: RefreshTokenClaims) =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenClaims;

export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenClaims;
