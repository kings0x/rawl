import { z } from "zod";

export const googleUserInfoSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
  given_name: z.string().trim().min(1).optional(),
  family_name: z.string().trim().min(1).optional(),
});

export type GoogleUserInfo = z.infer<typeof googleUserInfoSchema>;

export const parseGoogleUserInfo = (payload: unknown) => {
  const parsed = googleUserInfoSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Google profile is missing a verified email");
  }

  return {
    email: parsed.data.email.trim().toLowerCase(),
    displayName:
      parsed.data.name ??
      ([parsed.data.given_name, parsed.data.family_name].filter(Boolean).join(" ") || undefined),
  };
};
