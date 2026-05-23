import { z } from "zod";

export const painsListQuerySchema = z.object({
  category: z.enum(["WORK", "HEALTH", "FINANCE", "PARENTING", "HOME", "LEARNING", "OTHER"]).optional(),
  sort: z.enum(["recent", "popular"]).default("recent"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const painIdParamSchema = z.object({
  id: z.string().uuid(),
});
