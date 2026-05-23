import { describe, expect, it } from "vitest";

import { parseGoogleUserInfo } from "./google.schema.js";

describe("parseGoogleUserInfo", () => {
  it("normalizes google profile data", () => {
    expect(
      parseGoogleUserInfo({
        email: "GoogleUser@Example.com",
        given_name: "Google",
        family_name: "User",
      }),
    ).toEqual({
      email: "googleuser@example.com",
      displayName: "Google User",
    });
  });

  it("throws when email is missing", () => {
    expect(() =>
      parseGoogleUserInfo({
        name: "No Email",
      }),
    ).toThrow(/verified email/);
  });
});
