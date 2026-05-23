import type { Job } from "bullmq";

import { createLogger } from "../../../shared/config/logger.js";
import { env } from "../../../shared/config/env.js";
import type { EmailJob } from "../queues/email.queue.js";

const logger = createLogger(env);

export const processEmailJob = (job: Job<EmailJob>) => {
  logger.info({ jobId: job.id, template: job.data.template }, "Processed email placeholder job");
  return Promise.resolve();
};
