// Microsoft Outlook OAuth callback endpoint
import { NextRequest, NextResponse } from 'next/server';
import { exchangeOutlookAuthCode } from '../../../../../lib/auth/outlook-oauth';

export const dynamic = 'force-dynamic';

// GET /api/auth/outlook/callback - Handle Microsoft OAuth callback
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing Microsoft OAuth callback...');

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // contains userId

    if (error) {
      console.error('❌ Microsoft OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`);
    }

    if (!code || !state) {
      console.error('❌ Missing authorization code or state');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
    }

    const result = await exchangeOutlookAuthCode(code, state);

    if (result.success) {
      console.log('✅ Microsoft OAuth completed successfully');
      // Ensure AccountSyncState exists with default excluded domain
      try {
        const { prisma } = await import('../../../../../lib/prisma');
        const { userId: clerkUserId } = { userId: state } as any;
        const appUser = await prisma.user.findUnique({ where: { clerkId: state } });
        if (appUser && result.email) {
          const account = await (prisma as any).connectedEmailAccount.findFirst({ where: { userId: appUser.id, email: result.email } });
          if (account) {
            const domain = result.email.split('@')[1];
            await prisma.accountSyncState.upsert({
              where: { accountId: account.id },
              update: {},
              create: {
                userId: appUser.id,
                accountId: account.id,
                provider: 'OUTLOOK',
                isFullSyncEnabled: false,
                excludedDomains: domain ? [domain] : []
              }
            });
          }
        }
      } catch (e) {
        console.warn('Could not initialize AccountSyncState:', e);
      }
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=outlook_connected&email=${encodeURIComponent(result.email || '')}`);
    }

    console.error('❌ Microsoft OAuth failed:', result.error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=outlook_failed`);

  } catch (error) {
    console.error('💥 Microsoft OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed`);
  }
}