import { sendQueue, SendJob } from './worker';
import { randomUUID } from 'crypto';

export async function enqueueSend(job: Omit<SendJob, 'traceId'>) {
  const traceId = randomUUID();
  const jobId = `${job.campaignId}:${job.contactId}:${job.stepNumber}`;
  await sendQueue.add('send', { ...job, traceId }, { jobId });
}

