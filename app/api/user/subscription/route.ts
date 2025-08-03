import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatus } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const subscriptionStatus = await getSubscriptionStatus();
    
    return NextResponse.json(subscriptionStatus);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { hasSubscription: false, isActive: false },
      { status: 200 } // Don't return error, just false status
    );
  }
}