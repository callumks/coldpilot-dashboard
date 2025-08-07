// Microsoft Outlook OAuth initiation endpoint
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// GET /api/auth/outlook - Initiate Microsoft OAuth flow
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Initiating Microsoft OAuth flow...');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We'll implement the actual OAuth initiation here
    return NextResponse.json({ 
      message: 'Microsoft OAuth initiation - coming soon',
      userId 
    });

  } catch (error) {
    console.error('💥 Microsoft OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Microsoft OAuth' },
      { status: 500 }
    );
  }
}