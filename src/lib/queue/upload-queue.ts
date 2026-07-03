import { Queue } from "bullmq";

import { createRedisConnection } from "@/lib/queue/redis";

export const uploadQueueName = "upload-processing";

let queue: Queue<{ uploadId: string }> | undefined;

export function getUploadQueue() {
  queue ??= new Queue<{ uploadId: string }>(uploadQueueName, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: 500,
      removeOnFail: 1000
    }
  });

  return queue;
}

export async function enqueueUploadProcessing(uploadId: string) {
  try {
    await getUploadQueue().add("validate-upload", { uploadId }, { jobId: uploadId });
  } catch (error) {
    console.error("Failed to enqueue upload processing:", error);
    // Continue without queue processing - upload is saved but won't be processed
  }
}
