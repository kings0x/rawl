import { z } from "zod";

export const painIdSchema = z.object({
  id: z.string().uuid(),
});
