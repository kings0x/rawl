import { notificationQueue, type NotificationJob } from "../queues/notification.queue.js";

export const enqueueNotificationJob = async (payload: NotificationJob) => notificationQueue.add("send-notification", payload);
