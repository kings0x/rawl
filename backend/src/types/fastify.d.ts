import type { AccessTokenClaims } from "../shared/security/tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      isPremium: boolean;
      premiumTier: AccessTokenClaims["premiumTier"];
    };
  }

  interface FastifyInstance {
    googleOAuth2?: import("@fastify/oauth2").OAuth2Namespace;
  }
}
