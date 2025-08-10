import { prisma } from '../prisma';
import { createMicrosoftMSALClient } from '../auth/outlook-oauth';

export async function syncOutlook({ account, state, since }: { account: any; state: any; since: Date }) {
  const msal = createMicrosoftMSALClient();
  // Use stored token (silent refresh handled in sender path normally)
  const accessToken = account.accessToken;
  const isoSince = since.toISOString();

  const headers = { Authorization: `Bearer ${accessToken}` } as any;
  const endpoints = [
    `/me/mailFolders/SentItems/messages?$select=id,subject,conversationId,receivedDateTime,sentDateTime,from,toRecipients&$top=50&$filter=receivedDateTime ge ${isoSince}`,
    `/me/mailFolders/Inbox/messages?$select=id,subject,conversationId,receivedDateTime,sentDateTime,from,toRecipients&$top=50&$filter=receivedDateTime ge ${isoSince}`
  ];

  let imported = 0;
  for (const ep of endpoints) {
    const res = await fetch(`https://graph.microsoft.com/v1.0${ep}`, { headers });
    if (!res.ok) continue;
    const data = await res.json();
    for (const m of data.value || []) {
      const externalId = m.id;
      const threadKey = m.conversationId;
      const fromAddr = (m.from?.emailAddress?.address || '').toLowerCase();
      const toList = (m.toRecipients || []).map((r: any) => (r.emailAddress?.address || '').toLowerCase());
      const allAddrs = [fromAddr, ...toList].join(',');
      const domains = (state.excludedDomains || []).map((d: string) => d.toLowerCase());
      if (domains.some((d: string) => d && allAddrs.includes(`@${d}`))) continue;

      const isOutbound = fromAddr === account.email.toLowerCase();
      const direction = isOutbound ? 'OUTBOUND' : 'INBOUND';
      const existing = await prisma.message.findFirst({ where: { provider: 'OUTLOOK', externalId } });
      if (existing) continue;

      const source = isOutbound ? 'MANUAL' : 'IMPORTED';

      await prisma.message.create({
        data: {
          conversation: {
            connectOrCreate: {
              where: { id: `${account.userId}_${threadKey || externalId}` },
              create: { id: `${account.userId}_${threadKey || externalId}`, userId: account.userId, contactId: '', subject: m.subject || 'Conversation', status: 'SENT', lastMessageAt: new Date(), unreadCount: 0 }
            }
          },
          direction: direction as any,
          content: '',
          provider: 'OUTLOOK',
          externalId,
          threadKey,
          accountId: account.id,
          source: source as any,
          sentAt: new Date(m.sentDateTime || Date.now()),
          receivedAt: isOutbound ? null : new Date(m.receivedDateTime || Date.now())
        }
      });
      imported++;
    }
  }
  return { imported };
}

