import { z } from "zod";

export const commentBodySchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const commentIdSchema = z.object({
  id: z.string().uuid(),
});
