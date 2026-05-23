import type { OAuth2Namespace } from "@fastify/oauth2";
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
    googleOAuth2?: OAuth2Namespace;
  }
}
