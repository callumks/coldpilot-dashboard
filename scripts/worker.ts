import 'dotenv/config';
import { Worker, Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import universalSender from '../lib/email/universal-sender';

const connection = new IORedis(process.env.REDIS_URL!, {
  // Required by BullMQ v5
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Improve stability on ephemeral networks
  connectTimeout: 20000,
  keepAlive: 10000,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});
const QUEUE_NAME = process.env.QUEUE_NAME || 'campaign_step_send';

// Visibility: log connection and queue info
console.log(`[worker] starting. queue=${QUEUE_NAME}`);
connection.on('connect', () => console.log(`[worker] redis connected: ${process.env.REDIS_URL}`));
connection.on('error', (err) => console.error('[worker] redis error', err));

// BullMQ v5 no longer requires a separate QueueScheduler for delayed jobs

export type SendJob = {
  traceId: string;
  campaignId: string;
  contactId: string;
  stepNumber: number;
  fromAccountId?: string;
};

export const sendQueue = new Queue<SendJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  } as JobsOptions,
});

function jitter(seconds: number) {
  return Math.floor(Math.random() * seconds * 1000);
}

async function isWithinWindow(campaign: any) {
  if (!campaign.sendingWindow) return true;
  const { start, end, weekdaysOnly } = campaign.sendingWindow as any;
  const now = new Date();
  if (weekdaysOnly) {
    const d = now.getDay();
    if (d === 0 || d === 6) return false;
  }
  const hhmm = now.getHours() * 100 + now.getMinutes();
  const s = parseInt(String(start).replace(':', ''));
  const e = parseInt(String(end).replace(':', ''));
  return hhmm >= s && hhmm <= e;
}

export const worker = new Worker<SendJob>(
  QUEUE_NAME,
  async (job) => {
    const { campaignId, contactId, stepNumber, traceId } = job.data;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'ACTIVE') {
      return; // no-op
    }

    // Window check
    const inWindow = await isWithinWindow(campaign);
    if (!inWindow) {
      const next = new Date();
      next.setHours( (campaign.sendingWindow as any)?.start?.split(':')[0] || 9, 0, 0, 0);
      await job.moveToDelayed(next.getTime() + jitter(300));
      return;
    }

    // Idempotency via SendAttempt unique
    try {
      await (prisma as any).sendAttempt.create({ data: { campaignId, contactId, stepNumber } });
    } catch {
      return; // already attempted
    }

    // Load contact + step
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    const step = await prisma.campaignStep.findFirst({ where: { campaignId, stepNumber } });
    if (!contact || !step) return;

    // Create conversation if needed
    let convo = await prisma.conversation.findFirst({ where: { contactId: contact.id, campaignId } });
    if (!convo) {
      convo = await prisma.conversation.create({ data: { contactId: contact.id, campaignId, userId: campaign.userId, subject: step.subject, status: 'SENT', lastMessageAt: new Date(), unreadCount: 0 } });
    }

    // Create message record
    const message = await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUTBOUND', content: step.body, sentAt: new Date() } });

    const sendRes = await universalSender.sendEmail({ userId: campaign.userId, to: contact.email, toName: contact.name, subject: step.subject, body: step.body, messageId: message.id, contactId: contact.id, fromAccountId: (campaign as any).fromAccountId });

    await prisma.message.update({ where: { id: message.id }, data: { deliveredAt: sendRes.success ? new Date() : null } });
  },
  {
    connection,
    // Use group limiter based on fromAccountId if provided
    // For MVP, rely on default attempts/backoff and window checks
  }
);

// Lifecycle visibility
worker.on('ready', () => console.log('[worker] ready and listening for jobs'));
worker.on('completed', (job) => console.log(`[worker] completed job id=${job.id} traceId=${job.data.traceId}`));
worker.on('failed', (job, err) => console.error(`[worker] job failed id=${job?.id} traceId=${job?.data?.traceId}`, err));

process.on('SIGINT', async () => { await worker.close(); await connection.quit(); process.exit(0); });
