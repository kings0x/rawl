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

export const painUpdateSchema = z
  .object({
    rawDescription: z.string().trim().min(10).optional(),
    frequency: z.enum(["DAILY", "FEW_TIMES_WEEK", "MONTHLY", "FEW_TIMES_YEAR", "CONSTANTLY"]).optional(),
    workaround: z.string().trim().min(3).optional(),
    wtpEstimate: z.number().int().nonnegative().nullable().optional(),
    category: z.enum(["WORK", "HEALTH", "FINANCE", "PARENTING", "HOME", "LEARNING", "OTHER"]).optional(),
    country: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
    isAnonymous: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type PainUpdateInput = z.infer<typeof painUpdateSchema>;
