import { Worker } from "bullmq";
import IORedis from "ioredis";
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
// Dedicated process: FFmpeg is never executed inside the HTTP API.
// Real video jobs stay disabled until S3, quarantine scanning and FFmpeg
// adapters are configured and tested in the deployment environment.
new Worker("video-processing", async job => {
  if (job.name !== "health-check") throw new Error("Video processing adapter is not configured yet");
  return { ok: true };
}, { connection, concurrency: Number(process.env.VIDEO_CONCURRENCY ?? 2) });
console.log("UGS Creators worker started");
