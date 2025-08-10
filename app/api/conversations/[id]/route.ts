import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { createMicrosoftMSALClient, OUTLOOK_SCOPES } from '../../../../lib/auth/outlook-oauth';
import { getGoogleClientForAccount } from '../../../../lib/auth/google-oauth';

export const dynamic = 'force-dynamic';

// GET /api/conversations/[id] - Fetch a single conversation with full message list
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        contact: { select: { id: true, name: true, email: true, company: true } },
        messages: {
          orderBy: { sentAt: 'asc' },
          select: { id: true, content: true, direction: true, sentAt: true, isRead: true, externalId: true, accountId: true, conversationId: true, },
        },
        // Needed to determine provider per message via account relation
        
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Lazy-load bodies for messages with empty content
    const messagesNeedingBody = (conversation.messages || []).filter(m => (!m.content || m.content.length === 0) && m.externalId && m.accountId);
    if (messagesNeedingBody.length > 0) {
      // Group by account to minimize token work
      const accountIds = Array.from(new Set(messagesNeedingBody.map(m => m.accountId!)));
      const accounts = await prisma.connectedEmailAccount.findMany({ where: { id: { in: accountIds } }, select: { id: true, provider: true, accessToken: true, expiresAt: true, msalCache: true, msalHomeAccountId: true } as any });
      const idToAccount: Record<string, any> = Object.fromEntries(accounts.map(a => [a.id, a]));

      for (const msg of messagesNeedingBody) {
        const account = idToAccount[msg.accountId!];
        if (!account) continue;
        try {
          let bodyText: string | null = null;
          if (account.provider === 'OUTLOOK') {
            bodyText = await fetchOutlookMessageBody(account, msg.externalId!);
          } else if (account.provider === 'GMAIL') {
            bodyText = await fetchGmailMessageBody(account.id, msg.externalId!);
          }
          if (bodyText && bodyText.trim().length > 0) {
            await prisma.message.update({ where: { id: msg.id }, data: { content: bodyText } });
          }
        } catch {}
      }
      // Re-fetch messages after updates
      const refreshed = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { sentAt: 'asc' }, select: { id: true, content: true, direction: true, sentAt: true, isRead: true } });
      (conversation as any).messages = refreshed;
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        subject: conversation.subject,
        contact: conversation.contact,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error('💥 Fetch conversation detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helpers
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchOutlookMessageBody(account: any, messageId: string): Promise<string | null> {
  const msal = createMicrosoftMSALClient();
  let token = account.accessToken as string | undefined;
  const isExpired = !account.expiresAt || new Date(account.expiresAt) <= new Date(Date.now() + 2 * 60 * 1000);
  if ((isExpired || !token) && account.msalCache) {
    try {
      msal.getTokenCache().deserialize(account.msalCache);
      const accounts = await msal.getTokenCache().getAllAccounts();
      const msalAccount = accounts.find(a => a.homeAccountId === account.msalHomeAccountId) || accounts[0];
      if (msalAccount) {
        const silent = await msal.acquireTokenSilent({ account: msalAccount, scopes: OUTLOOK_SCOPES, forceRefresh: true });
        token = silent.accessToken;
        await prisma.connectedEmailAccount.update({ where: { id: account.id }, data: { accessToken: token, expiresAt: silent.expiresOn || new Date(Date.now() + 3600*1000), msalCache: msal.getTokenCache().serialize() } });
      }
    } catch {}
  }
  if (!token) return null;
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}?$select=body,bodyPreview`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const html = data?.body?.content as string | undefined;
  const preview = data?.bodyPreview as string | undefined;
  const text = html ? stripHtml(html) : (preview || '');
  return text || null;
}

async function fetchGmailMessageBody(accountId: string, messageId: string): Promise<string | null> {
  try {
    const oauth2Client = await getGoogleClientForAccount(accountId);
    const gmail = (await import('googleapis')).google.gmail({ version: 'v1', auth: oauth2Client });
    const res = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    const payload = res.data.payload;
    if (!payload) return null;
    const parts = payload.parts || [payload];
    const decode = (b64: string) => Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    let html = '';
    let text = '';
    const walk = (p: any) => {
      if (p.mimeType === 'text/html' && p.body?.data) html += decode(p.body.data);
      if (p.mimeType === 'text/plain' && p.body?.data) text += decode(p.body.data);
      (p.parts || []).forEach(walk);
    };
    parts.forEach(walk);
    const plain = text || stripHtml(html || '');
    return plain || null;
  } catch {
    return null;
  }
}

