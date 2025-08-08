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

      const messageParts = [
        `To: ${toName ? `${toName} <${to}>` : to}`,
        `Subject: ${subject}`,
        "Content-Type: text/html; charset=UTF-8",
        "MIME-Version: 1.0",
        "",
        body,
      ];
      const raw = Buffer.from(messageParts.join("\n")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
      await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
      return { success: true };
    }

    if (account.provider === "OUTLOOK") {
      // Send via Microsoft Graph using the user's delegated token stored in DB
      const accessToken = account.accessToken;

      const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: "HTML", content: body },
            toRecipients: [{ emailAddress: { address: to, name: toName } }],
          },
          saveToSentItems: true,
        }),
      });
      if (!res.ok) {
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