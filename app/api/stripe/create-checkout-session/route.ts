import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

// CORS headers for cross-domain requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://coldpilot.tech",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Type definitions
type Plan = 'basic' | 'pro' | 'agency';
type Interval = 'monthly' | 'yearly';

interface RequestBody {
  plan: Plan;
  interval: Interval;
}

// Price ID mapping - Updated to match your environment variable names
const PRICE_IDS: { [K in Plan]: { [J in Interval]: string } } = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_PRICE_BASIC_MONTHLY!,
    yearly: process.env.NEXT_PUBLIC_PRICE_BASIC_YEARLY!,
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY!,
    yearly: process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY!,
  },
  agency: {
    monthly: process.env.NEXT_PUBLIC_PRICE_AGENCY_MONTHLY!,
    yearly: process.env.NEXT_PUBLIC_PRICE_AGENCY_YEARLY!,
  },
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse the request body
    const body: RequestBody = await request.json();
    const { plan, interval } = body;

    // Validate input
    if (!plan || !interval) {
      return NextResponse.json(
        { error: 'Missing plan or interval' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['basic', 'pro', 'agency'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the price ID for the selected plan and interval
    const priceId = PRICE_IDS[plan][interval];
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not found for this plan and interval' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the base URL for redirects (always redirect to dashboard domain)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.coldpilot.tech';

    // Create Stripe checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_creation: 'always',
      metadata: {
        clerkUserId: userId,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          plan,
          interval,
        },
      },
    };

    // Add free trial for Pro and Agency plans (7 days)
    if (plan === 'pro' || plan === 'agency') {
      sessionParams.subscription_data = {
        ...sessionParams.subscription_data,
        trial_period_days: 7,
      };
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return the session URL
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof globalThis.Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 