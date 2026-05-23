import { Worker } from "bullmq";

import { getQueueConnection, queueNames } from "../shared/config/bullmq.js";
import { env } from "../shared/config/env.js";
import { createLogger } from "../shared/config/logger.js";
import { processAIJob } from "./bullmq/processors/ai.processor.js";
import { processEmailJob } from "./bullmq/processors/email.processor.js";
import { processNotificationJob } from "./bullmq/processors/notification.processor.js";

const logger = createLogger(env);
const queueConnection = getQueueConnection(env);

const workers = [
  new Worker(queueNames.notification, processNotificationJob, { connection: queueConnection }),
  new Worker(queueNames.email, processEmailJob, { connection: queueConnection }),
  new Worker(queueNames.ai, processAIJob, { connection: queueConnection }),
];

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    logger.error({ queue: worker.name, jobId: job?.id, error }, "Worker job failed");
  });
}

logger.info("BullMQ workers started");
