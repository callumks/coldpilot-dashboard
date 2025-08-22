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
  force?: boolean;
  ignoreWindow?: boolean;
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
  const tz = (campaign as any).timezone || 'UTC';
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
  const parts = fmt.formatToParts(now);
  const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const wdStr = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  const d = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wdStr);
  if (weekdaysOnly && (d === 0 || d === 6)) return false;
  const hhmm = hh * 100 + mm;
  const s = parseInt(String(start).replace(':', ''));
  const e = parseInt(String(end).replace(':', ''));
  return hhmm >= s && hhmm <= e;
}

function personalizeContent(template: string, contact: any): string {
  if (!template) return '';
  const firstName = (contact.name || '').split(' ')[0] || contact.name || '';
  const lastName = (contact.name || '').split(' ').slice(1).join(' ') || '';
  return template
    .replace(/\[firstName\]/g, firstName)
    .replace(/\[lastName\]/g, lastName)
    .replace(/\[name\]/g, contact.name || '')
    .replace(/\[company\]/g, contact.company || 'your company')
    .replace(/\[email\]/g, contact.email || '')
    .replace(/\[position\]/g, contact.position || '');
}

export const worker = new Worker<SendJob>(
  QUEUE_NAME,
  async (job) => {
    const { campaignId, contactId, stepNumber, traceId } = job.data;
    console.log(`[worker] received job id=${job.id} traceId=${traceId} campaign=${campaignId} contact=${contactId} step=${stepNumber}`);

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'ACTIVE') {
      return; // no-op
    }

    // Window check (skippable for explicit test jobs)
    const inWindow = await isWithinWindow(campaign);
    if (!inWindow && !job.data.ignoreWindow) {
      const tz = (campaign as any).timezone || 'UTC';
      const { start, end, weekdaysOnly } = (campaign.sendingWindow as any) || {};
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
      const parts = fmt.formatToParts(new Date());
      const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const wdStr = parts.find(p => p.type === 'weekday')?.value || 'Mon';
      const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wdStr);

      const startStr = String(start || '09:00');
      const startH = parseInt(startStr.split(':')[0] || '9', 10);
      const startM = parseInt(startStr.split(':')[1] || '0', 10);
      const endStr = String(end || '17:00');
      const endH = parseInt(endStr.split(':')[0] || '17', 10);
      const endM = parseInt(endStr.split(':')[1] || '0', 10);

      const nowMinutes = hh * 60 + mm;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      let daysToAdd = 0;
      if (weekdaysOnly) {
        if (dow === 6) {
          // Saturday -> Monday
          daysToAdd = 2;
        } else if (dow === 0) {
          // Sunday -> Monday
          daysToAdd = 1;
        } else if (nowMinutes > endMinutes) {
          // after end today
          daysToAdd = (dow === 5) ? 3 : 1; // Friday -> Monday
        } else if (nowMinutes < startMinutes) {
          daysToAdd = 0;
        }
      } else {
        if (nowMinutes > endMinutes) daysToAdd = 1; else daysToAdd = 0;
      }

      let minutesUntil = 0;
      if (daysToAdd === 0 && nowMinutes < startMinutes) {
        minutesUntil = startMinutes - nowMinutes;
      } else {
        minutesUntil = (daysToAdd * 24 * 60) + (24 * 60 - nowMinutes) + startMinutes;
      }

      const delayMs = Math.max(60_000, minutesUntil * 60 * 1000 + jitter(60));
      await job.moveToDelayed(Date.now() + delayMs);
      console.log(`[worker] out of window traceId=${traceId} rescheduled delayMs=${delayMs}`);
      return;
    }

    // Idempotency: skip only if an OUTBOUND message already exists for this campaign/contact
    const existingOutbound = await prisma.message.findFirst({
      where: { direction: 'OUTBOUND', conversation: { campaignId, contactId } },
      select: { id: true },
    });
    if (existingOutbound) {
      console.log(`[worker] duplicate (message exists), skipping traceId=${traceId}`);
      return;
    }

    // Attempt-level idempotency: create attempt if not forcing. If it already exists but no message, proceed anyway.
    if (!job.data.force) {
      try {
        await (prisma as any).sendAttempt.create({ data: { campaignId, contactId, stepNumber } });
      } catch {
        console.log(`[worker] prior attempt exists without message, proceeding traceId=${traceId}`);
      }
    } else {
      console.log(`[worker] FORCE sending traceId=${traceId}`);
    }

    // Load contact + step
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    const step = await prisma.campaignStep.findFirst({ where: { campaignId, stepNumber } });
    if (!contact || !step) return;

    const personalizedSubject = personalizeContent(step.subject, contact);
    const personalizedBody = personalizeContent(step.body, contact);

    // Create conversation if needed
    let convo = await prisma.conversation.findFirst({ where: { contactId: contact.id, campaignId } });
    if (!convo) {
      convo = await prisma.conversation.create({ data: { contactId: contact.id, campaignId, userId: campaign.userId, subject: personalizedSubject, status: 'SENT', lastMessageAt: new Date(), unreadCount: 0 } });
    }

    // Create message record
    const message = await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUTBOUND', content: personalizedBody, sentAt: new Date() } });

    console.log(`[worker] sending traceId=${traceId} to=${contact.email}`);
    const sendRes = await universalSender.sendEmail({ userId: campaign.userId, to: contact.email, toName: contact.name, subject: personalizedSubject, body: personalizedBody, messageId: message.id, contactId: contact.id, fromAccountId: (campaign as any).fromAccountId });
    console.log(`[worker] send result traceId=${traceId} success=${sendRes.success}${sendRes.error ? ` error=${sendRes.error}` : ''}`);

    await prisma.message.update({ where: { id: message.id }, data: { deliveredAt: sendRes.success ? new Date() : null } });

    // Update aggregate stats so /api/campaigns reflects progress without waiting for cron recompute
    try {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          emailsSent: { increment: 1 },
          ...(sendRes.success ? { emailsDelivered: { increment: 1 } } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // best-effort; keep processing
    }
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

// Lightweight internal scheduler: ping campaign cron every 5 minutes to ensure automatic processing
const CRON_URL = process.env.CRON_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.coldpilot.tech';
async function pingCron() {
  try {
    const url = `${CRON_URL.replace(/\/$/, '')}/api/cron/campaigns`;
    await fetch(url, { method: 'GET' });
    console.log('[worker] pinged campaign cron');
  } catch (e) {
    console.warn('[worker] cron ping failed');
  }
}

// Kick off immediately and then every 5 minutes
pingCron();
setInterval(pingCron, 5 * 60 * 1000);
