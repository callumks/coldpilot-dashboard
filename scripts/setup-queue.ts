import 'dotenv/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';

export type SendJob = {
  traceId: string;
  campaignId: string;
  contactId: string;
  stepNumber: number;
  fromAccountId?: string;
  force?: boolean;
};

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 20000,
  keepAlive: 10000,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});
const QUEUE_NAME = process.env.QUEUE_NAME || 'campaign_step_send';

export const sendQueue = new Queue<SendJob>(QUEUE_NAME, { connection });

export async function enqueueSend(job: Omit<SendJob, 'traceId'>, options?: { delayMs?: number }) {
  const traceId = randomUUID();
  const jobId = `${job.campaignId}:${job.contactId}:${job.stepNumber}`;
  // Allow re-enqueue by removing any stale completed/failed job with same id
  try { await sendQueue.remove(jobId); } catch {}
  await sendQueue.add('send', { ...job, traceId }, { jobId, delay: options?.delayMs || 0 });
}

