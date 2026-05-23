import { createQueue } from "../../../shared/config/bullmq.js";

export type EmailJob = {
  template: string;
  recipientId: string;
  payload: Record<string, unknown>;
};

export const emailQueue = createQueue<EmailJob>("email");
