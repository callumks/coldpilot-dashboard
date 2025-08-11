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
};

const connection = new IORedis(process.env.REDIS_URL!);
const QUEUE_NAME = process.env.QUEUE_NAME || 'campaign_step_send';

export const sendQueue = new Queue<SendJob>(QUEUE_NAME, { connection });

export async function enqueueSend(job: Omit<SendJob, 'traceId'>) {
  const traceId = randomUUID();
  const jobId = `${job.campaignId}:${job.contactId}:${job.stepNumber}`;
  await sendQueue.add('send', { ...job, traceId }, { jobId });
}

