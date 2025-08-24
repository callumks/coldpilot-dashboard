import { google } from 'googleapis';
import { prisma } from '../prisma';

function parseEmailAddress(value: string): { name?: string; email?: string } {
  const match = value.match(/"?([^"<]*)"?\s*<([^>]+)>/);
  if (match) return { name: match[1]?.trim(), email: match[2]?.trim().toLowerCase() };
  const simple = value.trim().toLowerCase();
  if (simple.includes('@')) return { email: simple };
  return {};
}

async function resolveContactId(userId: string, headerFrom: string, headerTo: string, headerCc: string, userEmail: string, excluded: string[]) {
  const parts = [headerFrom, headerTo, headerCc].join(',').split(',').map(s => s.trim()).filter(Boolean);
  // choose first address that is not the user's and not excluded
  for (const p of parts) {
    const { email, name } = parseEmailAddress(p);
    if (!email) continue;
    if (email === userEmail.toLowerCase()) continue;
    if (excluded.some(d => email.endsWith(`@${d}`))) continue;
    let contact = await prisma.contact.findFirst({ where: { userId, email } });
    if (!contact) {
      contact = await prisma.contact.create({ data: { userId, email, name: name || email, source: 'EMAIL', status: 'COLD' } as any });
    }
    return { contactId: contact.id, prospectEmail: email };
  }
  return { contactId: null, prospectEmail: null } as any;
}

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

      // Avoid enum-type mismatch with legacy DB: check by accountId + externalId instead of provider enum
      const existing = await prisma.message.findFirst({ where: { externalId, accountId: account.id } });
      if (existing) continue;

      const source = isOutbound ? 'MANUAL' : 'IMPORTED';

      const { contactId } = await (async () => {
        // Only match existing contacts; do not auto-create
        const parts = [headers['From']||'', headers['To']||'', headers['Cc']||''].join(',').split(',').map(s => s.trim()).filter(Boolean);
        for (const p of parts) {
          const { email } = parseEmailAddress(p);
          if (!email) continue;
          if (email.toLowerCase() === account.email.toLowerCase()) continue;
          const found = await prisma.contact.findFirst({ where: { userId: account.userId, email: email.toLowerCase() } });
          if (found) return { contactId: found.id } as any;
        }
        return { contactId: null } as any;
      })();
      if (!contactId) continue; // skip threads not tied to an existing contact

      // Try to attach to an existing conversation for this contact and (if available) campaign
      const existingConvo = await prisma.conversation.findFirst({ where: { userId: account.userId, contactId }, orderBy: { lastMessageAt: 'desc' } });
      const convId = existingConvo?.id || `${account.userId}_${threadKey || externalId}`;
      if (!existingConvo) {
        await prisma.conversation.create({ data: { id: convId, userId: account.userId, contactId, subject: headers['Subject'] || 'Conversation', status: isOutbound ? 'SENT' : 'REPLIED', lastMessageAt: new Date(), unreadCount: isOutbound ? 0 : 1 } });
      }
      await prisma.message.create({
        data: {
          conversation: { connect: { id: convId } },
          direction: direction as any,
          content: '',
          externalId,
          threadKey,
          account: { connect: { id: account.id } },
          sentAt: new Date(headers['Date'] || Date.now()),
          receivedAt: isOutbound ? null : new Date(headers['Date'] || Date.now())
        }
      });
      // Update conversation aggregates on inbound
      if (!isOutbound) {
        try {
          await prisma.conversation.update({ where: { id: convId }, data: { status: 'REPLIED', unreadCount: { increment: 1 }, lastMessageAt: new Date() } });
        } catch {}
      }
      results.push({ externalId });
    }
  }
  return { imported: results.length };
}

