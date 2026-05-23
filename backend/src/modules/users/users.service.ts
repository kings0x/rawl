import { eq } from "drizzle-orm";

import { db } from "../../shared/config/database.js";
import { users, type users as usersTable } from "../../database/drizzle/schema/index.js";

export class DuplicateEmailError extends Error {
  override name = "DuplicateEmailError";
}

export type PublicUser = Omit<typeof usersTable.$inferSelect, "passwordHash">;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const toPublicUser = (user: typeof usersTable.$inferSelect): PublicUser => {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
};

export const createUser = async (input: {
  email: string;
  passwordHash: string | null;
  displayName?: string;
}) => {
  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      })
      .returning();

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    return createdUser;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505") {
      throw new DuplicateEmailError("Email already in use");
    }

    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  return rows[0] ?? null;
};

export const findUserById = async (id: string) => {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
};

export const createOrUpdateGoogleUser = async (input: { email: string; displayName?: string }) => {
  const existingUser = await findUserByEmail(input.email);

  if (!existingUser) {
    return createUser({
      email: input.email,
      passwordHash: null,
      displayName: input.displayName,
    });
  }

  if (!existingUser.displayName && input.displayName) {
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: input.displayName,
      })
      .where(eq(users.id, existingUser.id))
      .returning();

    return updatedUser ?? existingUser;
  }

  return existingUser;
};
