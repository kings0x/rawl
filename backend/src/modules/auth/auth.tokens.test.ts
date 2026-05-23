import { describe, expect, it } from "vitest";

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../shared/security/tokens.js";

describe("auth tokens", () => {
  it("round-trips access tokens", () => {
    const token = signAccessToken({
      sub: "user-1",
      email: "rawl@example.com",
      isPremium: false,
      premiumTier: null,
    });

    expect(verifyAccessToken(token)).toMatchObject({
      sub: "user-1",
      email: "rawl@example.com",
      isPremium: false,
      premiumTier: null,
    });
  });

  it("round-trips refresh tokens", () => {
    const token = signRefreshToken({
      sub: "user-1",
      tokenType: "refresh",
    });

    expect(verifyRefreshToken(token)).toMatchObject({
      sub: "user-1",
      tokenType: "refresh",
    });
  });
});
