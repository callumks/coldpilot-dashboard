import { prisma } from "../prisma";

type SendEmailParams = {
  userId: string;
  to: string;
  toName?: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  body: string;
  messageId?: string;
  contactId?: string;
  campaignId?: string;
  fromAccountId?: string;
  overrideToEmail?: string;
};

// Pick the user's active connected email account to send from
async function selectActiveSenderAccount(userId: string, preferredAccountId?: string) {
  if (preferredAccountId) {
    const specific = await (prisma as any).connectedEmailAccount.findFirst({
      where: { id: preferredAccountId, userId, isActive: true },
    });
    if (specific) return specific;
  }
  return (prisma as any).connectedEmailAccount.findFirst({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { userId, subject, body, fromAccountId } = params;
  let to = params.to;
  let toName = params.toName;

  // Sandbox/override routing to avoid real recipients
  const globalOverride = process.env.EMAIL_TEST_RECIPIENT;
  const sandboxEnabled = process.env.EMAIL_SANDBOX_MODE === 'true';
  if (params.overrideToEmail || (sandboxEnabled && globalOverride)) {
    toName = `TEST for ${to}`;
    to = params.overrideToEmail || (globalOverride as string);
  }

  // Prepare bodies (preserve line breaks for plain text inputs)
  const isHtml = /<[^>]+>/.test(body);
  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const htmlBody = isHtml ? body : escapeHtml(body).replace(/\r?\n/g, '<br/>');
  const textBody = isHtml ? body.replace(/<[^>]+>/g, '') : body;

  // Enforce per-user daily send limits using Message records
  const rate = await checkDailyRateLimit(userId);
  if (!rate.allowed) {
    return { success: false, error: `Daily send limit reached (${rate.count}/${rate.limit})` };
  }

  const account = await selectActiveSenderAccount(userId, fromAccountId);
  if (!account) {
    return { success: false, error: "No connected email account found" };
  }

  try {
    if (account.provider === "GMAIL") {
      const { getGoogleClientForAccount } = await import("../auth/google-oauth");
      const oauth2Client = await getGoogleClientForAccount(account.id);
      const gmail = (await import("googleapis")).google.gmail({ version: "v1", auth: oauth2Client });

      const boundary = "mixed_" + Math.random().toString(36).slice(2);
      const unsubscribe = `<mailto:unsubscribe@${new URL('https://'+(params.to.split('@')[1]||'example.com')).host}>`;
      const headers = [
        `To: ${toName ? `${toName} <${to}>` : to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        `List-Unsubscribe: ${unsubscribe}`,
        `Reply-To: ${params.fromEmail || ''}`.trim(),
        `Content-Type: multipart/alternative; boundary=${boundary}`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        textBody,
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "",
        htmlBody,
        `--${boundary}--`
      ].filter(Boolean);

      const messageParts = headers;
      const raw = Buffer.from(messageParts.join("\n")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
      await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
      return { success: true };
    }

    if (account.provider === "OUTLOOK") {
      // Send via Microsoft Graph using the user's delegated token with silent refresh
      const { createMicrosoftMSALClient, OUTLOOK_SCOPES } = await import("../auth/outlook-oauth");
      const msalClient = createMicrosoftMSALClient();

      let accessToken = account.accessToken as string | undefined;
      const isExpired = !account.expiresAt || new Date(account.expiresAt) <= new Date(Date.now() + 2 * 60 * 1000);

      // Try silent refresh if we have cached tokens or token is near expiry
      if ((account as any).msalCache) {
        try {
          msalClient.getTokenCache().deserialize((account as any).msalCache);
          const accounts = await msalClient.getTokenCache().getAllAccounts();
          const msalAccount = accounts.find(a => a.homeAccountId === (account as any).msalHomeAccountId) || accounts[0];
          if (msalAccount && (isExpired || !accessToken)) {
            const silent = await msalClient.acquireTokenSilent({
              account: msalAccount,
              scopes: OUTLOOK_SCOPES,
            });
            accessToken = silent.accessToken;
            // Persist updated cache and expiry
            await (prisma as any).connectedEmailAccount.update({
              where: { id: account.id },
              data: {
                accessToken,
                expiresAt: silent.expiresOn || new Date(Date.now() + 3600 * 1000),
                msalCache: msalClient.getTokenCache().serialize(),
              }
            });
          }
        } catch (e) {
          // Fallback to existing token
        }
      }

      const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: "HTML", content: htmlBody },
            toRecipients: [{ emailAddress: { address: to, name: toName } }],
            replyTo: params.fromEmail ? [{ emailAddress: { address: params.fromEmail } }] : undefined,
            // Microsoft Graph only permits custom internetMessageHeaders that start with 'x-' or 'X-'
            internetMessageHeaders: [
              { name: "x-list-unsubscribe", value: `<mailto:unsubscribe@${(to.split('@')[1]||'example.com')}>` }
            ]
          },
          saveToSentItems: true,
        }),
      });
      if (!res.ok) {
        // Retry once if unauthorized by attempting silent refresh
        if (res.status === 401 && (account as any).msalCache) {
          try {
            msalClient.getTokenCache().deserialize((account as any).msalCache);
            const accounts = await msalClient.getTokenCache().getAllAccounts();
            const msalAccount = accounts.find(a => a.homeAccountId === (account as any).msalHomeAccountId) || accounts[0];
            if (msalAccount) {
              const silent = await msalClient.acquireTokenSilent({ account: msalAccount, scopes: OUTLOOK_SCOPES, forceRefresh: true });
              accessToken = silent.accessToken;
              await (prisma as any).connectedEmailAccount.update({
                where: { id: account.id },
                data: {
                  accessToken,
                  expiresAt: silent.expiresOn || new Date(Date.now() + 3600 * 1000),
                  msalCache: msalClient.getTokenCache().serialize(),
                }
              });
              const retry = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: { subject, body: { contentType: "HTML", content: body }, toRecipients: [{ emailAddress: { address: to, name: toName } }] },
                  saveToSentItems: true,
                }),
              });
              if (retry.ok) return { success: true };
            }
          } catch {}
        }
        const text = await res.text();
        throw new Error(`Graph sendMail failed: ${res.status} ${text}`);
      }
      return { success: true };
    }

    // Future: SMTP
    return { success: false, error: "Unsupported provider" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

async function checkDailyRateLimit(userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.message.count({
    where: {
      direction: "OUTBOUND",
      sentAt: { gte: startOfDay },
      conversation: { userId },
    },
  });

  // Default per-user daily limit; could be plan-based later
  const limit = 200;
  return { allowed: count < limit, count, limit };
}

export { checkDailyRateLimit };

export default {
  sendEmail,
  checkDailyRateLimit
};