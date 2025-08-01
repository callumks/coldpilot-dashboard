import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscription } from '../../../../lib/auth';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await getUserSubscription();
    
    if (!subscription) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof globalThis.Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 