import 'dotenv/config';
import { Worker, Queue, JobsOptions, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import universalSender from '../lib/email/universal-sender';

const connection = new IORedis(process.env.REDIS_URL!);
const QUEUE_NAME = process.env.QUEUE_NAME || 'campaign_step_send';

// Ensure scheduler for delayed jobs
new QueueScheduler(QUEUE_NAME, { connection });

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
      await prisma.sendAttempt.create({ data: { campaignId, contactId, stepNumber } });
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

process.on('SIGINT', async () => { await worker.close(); await connection.quit(); process.exit(0); });
