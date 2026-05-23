import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./auth.service.js";

describe("auth service", () => {
  it("hashes passwords using a non-reversible hash", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, "wrong password")).toBe(false);
  });
});
