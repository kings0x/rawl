import { emailQueue, type EmailJob } from "../queues/email.queue.js";

export const enqueueEmailJob = async (payload: EmailJob) => emailQueue.add("send-email", payload);
