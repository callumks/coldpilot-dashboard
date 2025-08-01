import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export type Plan = 'BASIC' | 'PRO' | 'AGENCY';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export interface UserSubscription {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        subscription: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.subscription) {
      return null;
    }

    const subscription = user.subscription;
    const isActive = ['TRIALING', 'ACTIVE'].includes(subscription.status);

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      isActive,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

export async function requireSubscription(minimumPlan?: Plan): Promise<UserSubscription> {
  const subscription = await getUserSubscription();
  
  if (!subscription || !subscription.isActive) {
    throw new globalThis.Error('Active subscription required');
  }

  if (minimumPlan) {
    const planHierarchy: Plan[] = ['BASIC', 'PRO', 'AGENCY'];
    const userPlanIndex = planHierarchy.indexOf(subscription.plan);
    const minimumPlanIndex = planHierarchy.indexOf(minimumPlan);
    
    if (userPlanIndex < minimumPlanIndex) {
      throw new globalThis.Error(`${minimumPlan} plan or higher required`);
    }
  }

  return subscription;
}

export async function checkFeatureAccess(feature: string): Promise<boolean> {
  const subscription = await getUserSubscription();
  
  if (!subscription || !subscription.isActive) {
    return false;
  }

  // Feature access rules based on plan
  const featureAccess: Record<Plan, string[]> = {
    BASIC: ['basic_features', 'contacts', 'conversations'],
    PRO: ['basic_features', 'contacts', 'conversations', 'analytics', 'campaigns', 'ai_assistance'],
    AGENCY: ['basic_features', 'contacts', 'conversations', 'analytics', 'campaigns', 'ai_assistance', 'team_management', 'white_label'],
  };

  return featureAccess[subscription.plan]?.includes(feature) || false;
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  switch (status) {
    case 'TRIALING':
      return 'Free Trial';
    case 'ACTIVE':
      return 'Active';
    case 'PAST_DUE':
      return 'Payment Due';
    case 'CANCELED':
      return 'Canceled';
    case 'UNPAID':
      return 'Unpaid';
    default:
      return 'Unknown';
  }
} 