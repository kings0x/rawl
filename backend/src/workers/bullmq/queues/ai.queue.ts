import { createQueue } from "../../../shared/config/bullmq.js";

export type AIJob = {
  type: string;
  entityId: string;
};

export const aiQueue = createQueue<AIJob>("ai");
