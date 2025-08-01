import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout completion for session:', session.id);

    const metadata = session.metadata;
    const clerkUserId = metadata?.clerkUserId;
    const plan = metadata?.plan;
    const interval = metadata?.interval;
    
    if (!clerkUserId || !plan || !interval) {
      throw new Error('Missing required metadata in checkout session');
    }

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    const customerName = session.customer_details?.name || '';
    const nameParts = customerName.split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    
    // Create or update user
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {
        email: session.customer_details?.email || '',
      },
      create: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clerkId: clerkUserId,
        email: session.customer_details?.email || '',
        firstName: firstName,
        lastName: lastName,
      },
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: (subscription as any).items?.data?.[0]?.price?.id || '',
        status: mapStripeStatus((subscription as any).status),
        plan: plan.toUpperCase() as 'BASIC' | 'PRO' | 'AGENCY',
        interval: interval.toUpperCase() as 'MONTHLY' | 'YEARLY',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
        trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
        userId: user.id,
      },
    });

    console.log(`✅ Created subscription for user ${clerkUserId}`);

  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);

    const metadata = subscription.metadata;
    const plan = metadata?.plan;
    const interval = metadata?.interval;

    const updateData: any = {
      status: mapStripeStatus(subscription.status),
      stripePriceId: (subscription as any).items?.data?.[0]?.price?.id || '',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
      canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
    };

    if (plan && typeof plan === 'string') {
      updateData.plan = plan.toUpperCase();
    }
    if (interval && typeof interval === 'string') {
      updateData.interval = interval.toUpperCase();
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: updateData,
    });

    console.log(`✅ Updated subscription ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment success for invoice:', invoice.id);

    if ((invoice as any).subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: (invoice as any).subscription as string },
        data: {
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Confirmed billing for subscription ${(invoice as any).subscription}`);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment failure for invoice:', invoice.id);

    if ((invoice as any).subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: (invoice as any).subscription as string },
        data: {
          status: 'PAST_DUE',
        },
      });

      console.log(`⚠️ Marked subscription as past due: ${(invoice as any).subscription}`);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription deletion:', subscription.id);

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    console.log(`✅ Deactivated subscription ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

function mapStripeStatus(stripeStatus: string): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' {
  switch (stripeStatus) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    case 'incomplete':
    case 'unpaid':
      return 'UNPAID';
    default:
      console.warn(`Unknown Stripe status: ${stripeStatus}, defaulting to UNPAID`);
      return 'UNPAID';
  }
} 