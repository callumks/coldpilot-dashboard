// Google OAuth callback endpoint
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeGoogleAuthCode } from '../../../../../lib/auth/google-oauth';

export const dynamic = 'force-dynamic';

// GET /api/auth/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing Google OAuth callback...');

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the userId

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`);
    }

    if (!code || !state) {
      console.error('❌ Missing authorization code or state');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
    }

    // Exchange code for tokens and store in database
    const result = await exchangeGoogleAuthCode(code, state);
    
    if (result.success) {
      console.log('✅ Google OAuth completed successfully');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=google_connected&email=${encodeURIComponent(result.email || '')}`);
    } else {
      console.error('❌ Google OAuth failed:', result.error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_failed`);
    }

  } catch (error) {
    console.error('💥 Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed`);
  }
}