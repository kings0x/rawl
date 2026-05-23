import { z } from "zod";

export const painSchema = z.object({
  rawDescription: z.string().trim().min(10),
  frequency: z.enum(["DAILY", "FEW_TIMES_WEEK", "MONTHLY", "FEW_TIMES_YEAR", "CONSTANTLY"]),
  workaround: z.string().trim().min(3),
  wtpEstimate: z.number().int().nonnegative().optional(),
  category: z.enum(["WORK", "HEALTH", "FINANCE", "PARENTING", "HOME", "LEARNING", "OTHER"]),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export type PainInput = z.infer<typeof painSchema>;
