import { google } from 'googleapis';
import { prisma } from '../prisma';

export async function syncGmail({ account, state, since }: { account: any; state: any; since: Date }) {
  const oauth2Client = await (await import('../auth/google-oauth')).getGoogleClientForAccount(account.id);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const q = `newer_than:${Math.max(1, Math.floor((Date.now() - since.getTime()) / (1000*60*60*24)))}d`;
  const results: any[] = [];

  for (const label of ['SENT', 'INBOX']) {
    const list = await gmail.users.messages.list({ userId: 'me', labelIds: [label], q });
    const ids = (list.data.messages || []).map(m => m.id!).slice(0, 200);
    for (const id of ids) {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['Message-Id','Thread-Id','From','To','Cc','Subject','Date'] });
      const headers = Object.fromEntries((msg.data.payload?.headers || []).map(h => [h.name || '', h.value || '']));
      const externalId = headers['Message-Id'] || msg.data.id;
      const threadKey = msg.data.threadId || headers['Thread-Id'] || undefined;

      const addresses = [headers['From']||'', headers['To']||'', headers['Cc']||''].join(',').toLowerCase();
      const domains = (state.excludedDomains || []).map((d: string) => d.toLowerCase());
      if (domains.some((d: string) => d && addresses.includes(`@${d}`))) continue;

      const from = (headers['From']||'').toLowerCase();
      const isOutbound = from.includes(account.email.toLowerCase());
      const direction = isOutbound ? 'OUTBOUND' : 'INBOUND';

      const existing = await prisma.message.findFirst({ where: { provider: 'GMAIL', externalId } });
      if (existing) continue;

      const source = isOutbound ? 'MANUAL' : 'IMPORTED';

      await prisma.message.create({
        data: {
          conversation: {
            connectOrCreate: {
              where: { id: `${account.userId}_${threadKey || externalId}` },
              create: { id: `${account.userId}_${threadKey || externalId}`, userId: account.userId, contactId: '', subject: headers['Subject'] || 'Conversation', status: 'SENT', lastMessageAt: new Date(), unreadCount: 0 }
            }
          },
          direction: direction as any,
          content: '',
          provider: 'GMAIL',
          externalId,
          threadKey,
          accountId: account.id,
          source: source as any,
          sentAt: new Date(headers['Date'] || Date.now()),
          receivedAt: isOutbound ? null : new Date(headers['Date'] || Date.now())
        }
      });
      results.push({ externalId });
    }
  }
  return { imported: results.length };
}

