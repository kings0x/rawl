import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyAccessToken } from "../security/tokens.js";

const bearerPrefix = "bearer ";

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.toLowerCase().startsWith(bearerPrefix)) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const token = authorization.slice(bearerPrefix.length).trim();

  if (!token) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  try {
    const claims = verifyAccessToken(token);

    request.user = {
      id: claims.sub,
      email: claims.email,
      isPremium: claims.isPremium,
      premiumTier: claims.premiumTier,
    };
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
};
