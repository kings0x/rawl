import type { Job } from "bullmq";

import { createLogger } from "../../../shared/config/logger.js";
import { env } from "../../../shared/config/env.js";
import type { AIJob } from "../queues/ai.queue.js";

const logger = createLogger(env);

export const processAIJob = (job: Job<AIJob>) => {
  logger.info({ jobId: job.id, type: job.data.type }, "Processed AI placeholder job");
  return Promise.resolve();
};
