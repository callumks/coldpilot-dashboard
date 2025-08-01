import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Billing portal request received');
    
    const { userId } = await auth();
    console.log('👤 User ID from auth:', userId);
    
    if (!userId) {
      console.log('❌ No user ID - unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription to find their Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true },
    });

    console.log('👤 User found:', !!user);
    console.log('💳 Subscription found:', !!user?.subscription);
    console.log('🆔 Customer ID:', user?.subscription?.stripeCustomerId);

    if (!user || !user.subscription) {
      console.log('❌ No user or subscription found');
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🌐 Base URL for return:', baseUrl);

    // Create a billing portal session
    console.log('🔄 Creating Stripe billing portal session...');
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });

    console.log('✅ Portal session created successfully');
    console.log('🔗 Portal URL:', portalSession.url);

    return NextResponse.json({ 
      url: portalSession.url 
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof globalThis.Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 