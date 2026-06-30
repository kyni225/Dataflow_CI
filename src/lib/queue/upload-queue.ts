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
  await getUploadQueue().add("validate-upload", { uploadId }, { jobId: uploadId });
}
