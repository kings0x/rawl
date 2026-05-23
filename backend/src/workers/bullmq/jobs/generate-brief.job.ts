import { aiQueue, type AIJob } from "../queues/ai.queue.js";

export const enqueueAIBriefJob = async (payload: AIJob) => aiQueue.add("generate-brief", payload);
