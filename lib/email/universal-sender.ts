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
};

async function sendEmail(_params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  // Stub implementation: in production, route to provider-specific sender
  return { success: true };
}

async function checkDailyRateLimit(_userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  // Stub rate-limit always allows
  return { allowed: true, count: 0, limit: 9999 };
}

export { checkDailyRateLimit };

export default {
  sendEmail,
  checkDailyRateLimit
};