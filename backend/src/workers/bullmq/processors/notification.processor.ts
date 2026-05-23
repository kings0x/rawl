import type { Job } from "bullmq";

import { createLogger } from "../../../shared/config/logger.js";
import { env } from "../../../shared/config/env.js";
import type { NotificationJob } from "../queues/notification.queue.js";

const logger = createLogger(env);

export const processNotificationJob = (job: Job<NotificationJob>) => {
  logger.info({ jobId: job.id, type: job.data.type }, "Processed notification placeholder job");
  return Promise.resolve();
};
