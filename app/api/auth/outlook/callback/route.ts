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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=outlook_connected&email=${encodeURIComponent(result.email || '')}`);
    }

    console.error('❌ Microsoft OAuth failed:', result.error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=outlook_failed`);

  } catch (error) {
    console.error('💥 Microsoft OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed`);
  }
}