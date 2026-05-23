import oauthPlugin from "@fastify/oauth2";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

import { loginSchema } from "./auth.schema.js";
import { parseGoogleUserInfo } from "./google.schema.js";
import { hashPassword, verifyPassword } from "./auth.service.js";
import {
  deleteRefreshSession,
  getRefreshTokenTtlMs,
  hasRefreshSession,
  storeRefreshSession,
} from "./auth.session.js";
import { registerUserSchema } from "../users/users.schema.js";
import {
  createOrUpdateGoogleUser,
  createUser,
  DuplicateEmailError,
  findUserById,
  findUserByEmail,
  toPublicUser,
} from "../users/users.service.js";
import { env } from "../../shared/config/env.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/security/tokens.js";

const refreshCookieName = "rawl_refresh_token";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production" || env.NODE_ENV === "staging",
  path: "/api/v1/auth",
};

const hasGoogleAuthConfig = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);

const issueSessionForUser = async (user: Awaited<ReturnType<typeof findUserByEmail>>, reply: FastifyReply) => {
  if (!user) {
    throw new Error("User is required to issue a session");
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    isPremium: user.isPremium,
    premiumTier: user.premiumTier,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    tokenType: "refresh",
  });

  const refreshTokenTtlMs = getRefreshTokenTtlMs(env.JWT_REFRESH_EXPIRES_IN);
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlMs);

  await storeRefreshSession({
    userId: user.id,
    refreshToken,
    expiresAt: refreshTokenExpiresAt,
  });

  reply.setCookie(refreshCookieName, refreshToken, {
    ...refreshCookieOptions,
    maxAge: Math.floor(refreshTokenTtlMs / 1000),
  });

  return accessToken;
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  if (hasGoogleAuthConfig) {
    await app.register(oauthPlugin, {
      name: "googleOAuth2",
      scope: ["profile", "email"],
      credentials: {
        client: {
          id: env.GOOGLE_CLIENT_ID!,
          secret: env.GOOGLE_CLIENT_SECRET!,
        },
        auth: {
          authorizeHost: "https://accounts.google.com",
          authorizePath: "/o/oauth2/v2/auth",
          tokenHost: "https://oauth2.googleapis.com",
          tokenPath: "/token",
        },
      },
      callbackUri: env.GOOGLE_CALLBACK_URL!,
    });
  }

  app.post("/auth/register", async (request, reply) => {
    const parsed = registerUserSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(422).send({
        error: "Validation error",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    try {
      const user = await createUser({
        email: parsed.data.email,
        passwordHash,
        displayName: parsed.data.displayName,
      });

      return reply.code(201).send({
        user: toPublicUser(user),
      });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return reply.code(409).send({
          error: "Email already in use",
        });
      }

      throw error;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(422).send({
        error: "Validation error",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await findUserByEmail(parsed.data.email);

    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, parsed.data.password);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const accessToken = await issueSessionForUser(user, reply);

    return reply.send({
      accessToken,
      user: toPublicUser(user),
    });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies[refreshCookieName];

    if (!refreshToken) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    try {
      const claims = verifyRefreshToken(refreshToken);

      if (claims.tokenType !== "refresh") {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      if (!(await hasRefreshSession(refreshToken))) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      await deleteRefreshSession(refreshToken);

      const user = await findUserById(claims.sub);

      if (!user) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const accessToken = await issueSessionForUser(user, reply);

      return reply.send({
        accessToken,
      });
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.post(
    "/auth/logout",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const refreshToken = request.cookies[refreshCookieName];

      if (refreshToken) {
        await deleteRefreshSession(refreshToken);
      }

      reply.clearCookie(refreshCookieName, {
        ...refreshCookieOptions,
      });

      return reply.send({ success: true });
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: authenticate,
    },
    (request) => ({
      user: request.user,
    }),
  );

  app.get("/auth/google", async (request, reply) => {
    if (!hasGoogleAuthConfig || !app.googleOAuth2) {
      return reply.code(503).send({ error: "Google OAuth is not configured" });
    }

    const redirectUrl = await app.googleOAuth2.generateAuthorizationUri(request, reply);
    return reply.redirect(redirectUrl);
  });

  app.get("/auth/google/callback", async (request, reply) => {
    if (!hasGoogleAuthConfig || !app.googleOAuth2) {
      return reply.code(503).send({ error: "Google OAuth is not configured" });
    }

    const tokenResponse = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
    const accessToken = tokenResponse.token.access_token;

    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return reply.code(502).send({ error: "Failed to fetch Google profile" });
    }

    const profile = parseGoogleUserInfo(await response.json());
    const user = await createOrUpdateGoogleUser(profile);
    const sessionAccessToken = await issueSessionForUser(user, reply);

    return reply.send({
      accessToken: sessionAccessToken,
      user: toPublicUser(user),
    });
  });
};
