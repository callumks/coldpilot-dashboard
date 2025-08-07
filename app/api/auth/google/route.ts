// Google OAuth initiation endpoint
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGoogleAuthUrl } from '../../../../lib/auth/google-oauth';

export const dynamic = 'force-dynamic';

// GET /api/auth/google - Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Initiating Google OAuth flow...');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate Google OAuth URL
    const authUrl = getGoogleAuthUrl(userId);
    
    console.log('✅ Generated Google OAuth URL');
    
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('💥 Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}