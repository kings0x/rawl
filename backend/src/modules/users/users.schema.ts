import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12),
  displayName: z.string().trim().min(1).max(120).optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
