import { prisma } from '../prisma';
import { createMicrosoftMSALClient, OUTLOOK_SCOPES } from '../auth/outlook-oauth';

export async function syncOutlook({ account, state, since }: { account: any; state: any; since: Date }) {
  const msal = createMicrosoftMSALClient();

  async function getFreshAccessToken(): Promise<string> {
    let token = account.accessToken as string | undefined;
    const isExpired = !account.expiresAt || new Date(account.expiresAt) <= new Date(Date.now() + 2 * 60 * 1000);
    if (!isExpired && token) return token;

    if (account.msalCache) {
      try {
        msal.getTokenCache().deserialize(account.msalCache);
        const accounts = await msal.getTokenCache().getAllAccounts();
        const msalAccount = accounts.find(a => a.homeAccountId === account.msalHomeAccountId) || accounts[0];
        if (msalAccount) {
          const silent = await msal.acquireTokenSilent({ account: msalAccount, scopes: OUTLOOK_SCOPES, forceRefresh: true });
          token = silent.accessToken;
          await (prisma as any).connectedEmailAccount.update({
            where: { id: account.id },
            data: {
              accessToken: token,
              expiresAt: silent.expiresOn || new Date(Date.now() + 3600 * 1000),
              msalCache: msal.getTokenCache().serialize(),
            }
          });
          return token!;
        }
      } catch (e) {
        console.warn('Outlook sync: silent refresh failed; proceeding with existing token');
      }
    }
    return token as string;
  }

  async function graphGet(path: string): Promise<Response> {
    const token = await getFreshAccessToken();
    let res = await fetch(`https://graph.microsoft.com/v1.0${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 && account.msalCache) {
      // try silent refresh once
      try {
        msal.getTokenCache().deserialize(account.msalCache);
        const accounts = await msal.getTokenCache().getAllAccounts();
        const msalAccount = accounts.find(a => a.homeAccountId === account.msalHomeAccountId) || accounts[0];
        if (msalAccount) {
          const silent = await msal.acquireTokenSilent({ account: msalAccount, scopes: OUTLOOK_SCOPES, forceRefresh: true });
          const newToken = silent.accessToken;
          await (prisma as any).connectedEmailAccount.update({
            where: { id: account.id },
            data: {
              accessToken: newToken,
              expiresAt: silent.expiresOn || new Date(Date.now() + 3600 * 1000),
              msalCache: msal.getTokenCache().serialize(),
            }
          });
          res = await fetch(`https://graph.microsoft.com/v1.0${path}`, { headers: { Authorization: `Bearer ${newToken}` } });
        }
      } catch {}
    }
    return res;
  }

  const isoSince = since.toISOString();

  // Use sentDateTime for SentItems, receivedDateTime for Inbox
  const endpoints = [
    `/me/mailFolders/SentItems/messages?$select=id,subject,conversationId,receivedDateTime,sentDateTime,from,toRecipients&$top=100&$filter=sentDateTime ge ${isoSince}`,
    `/me/mailFolders/Inbox/messages?$select=id,subject,conversationId,receivedDateTime,sentDateTime,from,toRecipients&$top=100&$filter=receivedDateTime ge ${isoSince}`
  ];

  let imported = 0;
  const errors: any[] = [];
  for (const ep of endpoints) {
    const res = await graphGet(ep);
    if (!res.ok) {
      const text = await res.text();
      errors.push({ endpoint: ep, status: res.status, body: text });
      continue;
    }
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
      // Avoid enum-type mismatch with legacy DB: check by accountId + externalId instead of provider enum
      const existing = await prisma.message.findFirst({ where: { externalId, accountId: account.id } });
      if (existing) continue;

      const source = isOutbound ? 'MANUAL' : 'IMPORTED';

      // Only attach to existing contacts; skip if not found
      const prospect = isOutbound ? toList.find((e: string) => e !== account.email.toLowerCase()) : fromAddr;
      const contact = prospect ? await prisma.contact.findFirst({ where: { userId: account.userId, email: prospect } }) : null;
      if (!contact) continue;

      await prisma.message.create({
        data: {
          conversation: {
            connectOrCreate: {
              where: { id: `${account.userId}_${threadKey || externalId}` },
              create: { id: `${account.userId}_${threadKey || externalId}`, userId: account.userId, contactId: contact.id, subject: m.subject || 'Conversation', status: 'SENT', lastMessageAt: new Date(), unreadCount: 0 }
            }
          },
          direction: direction as any,
          content: '',
          // omit provider to avoid enum cast issues against legacy text column
          externalId,
          threadKey,
          account: { connect: { id: account.id } },
          sentAt: new Date(m.sentDateTime || Date.now()),
          receivedAt: isOutbound ? null : new Date(m.receivedDateTime || Date.now())
        }
      });
      imported++;
    }
  }
  return { imported, errors };
}

