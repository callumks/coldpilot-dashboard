// Google OAuth initiation endpoint
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// GET /api/auth/google - Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Initiating Google OAuth flow...');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We'll implement the actual OAuth initiation here
    return NextResponse.json({ 
      message: 'Google OAuth initiation - coming soon',
      userId 
    });

  } catch (error) {
    console.error('💥 Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}