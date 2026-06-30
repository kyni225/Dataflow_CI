import { Worker } from "bullmq";

import { createRedisConnection } from "@/lib/queue/redis";
import { uploadQueueName } from "@/lib/queue/upload-queue";
import { processUpload } from "@/services/upload-processing-service";

const worker = new Worker<{ uploadId: string }>(
  uploadQueueName,
  async (job) => {
    await processUpload(job.data.uploadId);
  },
  {
    connection: createRedisConnection(),
    concurrency: Number(process.env.UPLOAD_WORKER_CONCURRENCY ?? 3)
  }
);

worker.on("completed", (job) => {
  console.log({ event: "upload.completed", jobId: job.id, uploadId: job.data.uploadId });
});

worker.on("failed", (job, error) => {
  console.error({
    event: "upload.failed",
    jobId: job?.id,
    uploadId: job?.data.uploadId,
    error: error.message
  });
});

console.log({ event: "worker.started", queue: uploadQueueName });
