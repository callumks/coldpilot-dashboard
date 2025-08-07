import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { prisma } from '../prisma';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const MICROSOFT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`;

// Required Microsoft Graph scopes
const OUTLOOK_SCOPES = [
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/User.Read',
  'offline_access'
];

if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.warn('⚠️ Microsoft OAuth credentials not configured');
  console.warn('🔧 Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in environment variables');
}

function createMsalConfig(): Configuration {
  return {
    auth: {
      clientId: MICROSOFT_CLIENT_ID || '',
      authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
      clientSecret: MICROSOFT_CLIENT_SECRET || ''
    },
    system: {
      loggerOptions: {
        loggerCallback: () => {},
        piiLoggingEnabled: false,
        logLevel: 0
      }
    }
  };
}

export function createMicrosoftMSALClient(): ConfidentialClientApplication {
  return new ConfidentialClientApplication(createMsalConfig());
}

export function getOutlookAuthUrl(userId: string): string {
  const msalClient = createMicrosoftMSALClient();
  const authCodeUrlParameters = {
    scopes: OUTLOOK_SCOPES,
    redirectUri: MICROSOFT_REDIRECT_URI,
    state: userId,
    prompt: 'consent'
  } as const;

  return (msalClient.getAuthCodeUrl(authCodeUrlParameters) as unknown) as string;
}

export async function exchangeOutlookAuthCode(
  code: string,
  clerkUserId: string
): Promise<{ success: boolean; error?: string; email?: string }> {
  try {
    const msalClient = createMicrosoftMSALClient();

    const tokenRequest = {
      code,
      scopes: OUTLOOK_SCOPES,
      redirectUri: MICROSOFT_REDIRECT_URI
    };

    const result = await msalClient.acquireTokenByCode(tokenRequest);

    if (!result || !result.accessToken) {
      throw new Error('No access token received from Microsoft');
    }

    const email = result.account?.username;
    if (!email) {
      throw new Error('Could not retrieve user email from Microsoft');
    }

    // Resolve internal app user id
    let appUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email
        }
      });
    }

    const expiresAt = result.expiresOn || new Date(Date.now() + 3600 * 1000);

    // Upsert connected account
    await prisma.connectedEmailAccount.upsert({
      where: { email },
      update: {
        accessToken: result.accessToken,
        // MSAL node does not expose refreshToken; rely on re-auth later if needed
        expiresAt,
        isActive: true,
        lastUsed: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: appUser.id,
        email,
        provider: 'OUTLOOK',
        accessToken: result.accessToken,
        expiresAt,
        isActive: true,
        lastUsed: new Date()
      }
    });

    return { success: true, email };
  } catch (error) {
    console.error('💥 Microsoft OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Microsoft OAuth failed'
    };
  }
}

export default {
  getOutlookAuthUrl,
  exchangeOutlookAuthCode
};