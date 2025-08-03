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

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        subscription: true,
      },
    });

    // If user doesn't exist, create them automatically
    if (!user) {
      console.log('🔄 Creating new user in database:', userId);
      
      try {
        // Get user details from Clerk
        const { currentUser } = await import('@clerk/nextjs/server');
        const clerkUser = await currentUser();
        
        if (!clerkUser) {
          console.error('Could not get Clerk user details');
          return null;
        }

        const userEmail = clerkUser.emailAddresses[0]?.emailAddress || '';
        
        // Try to create user, handle email conflicts gracefully
        try {
          user = await prisma.user.create({
            data: {
              clerkId: userId,
              email: userEmail,
              firstName: clerkUser.firstName || null,
              lastName: clerkUser.lastName || null,
              imageUrl: clerkUser.imageUrl || null,
            },
            include: {
              subscription: true,
            },
          });
          console.log('✅ User created successfully:', user.id);
        } catch (createError: any) {
          if (createError.code === 'P2002' && createError.meta?.target?.includes('email')) {
            // Email already exists, try to find and update existing user
            console.log('Email already exists, finding existing user...');
            const existingUser = await prisma.user.findUnique({
              where: { email: userEmail },
              include: { subscription: true }
            });
            
            if (existingUser && !existingUser.clerkId) {
              // Update existing user with Clerk ID
              user = await prisma.user.update({
                where: { id: existingUser.id },
                data: { clerkId: userId },
                include: { subscription: true }
              });
              console.log('✅ Updated existing user with Clerk ID:', user.id);
            } else if (existingUser && existingUser.clerkId === userId) {
              // User already exists with same Clerk ID
              user = existingUser;
              console.log('✅ Found existing user:', user.id);
            } else {
              console.error('Email conflict but unable to resolve');
              return null;
            }
          } else {
            throw createError;
          }
        }
      } catch (error) {
        console.error('Error in auto user creation:', error);
        return null;
      }
    }

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
    const planValues: { [key: string]: number } = { 'BASIC': 0, 'PRO': 1, 'AGENCY': 2 };
    const userPlanLevel = planValues[subscription.plan] || 0;
    const minimumPlanLevel = planValues[minimumPlan] || 0;
    
    if (userPlanLevel < minimumPlanLevel) {
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
  const featureAccess: { [K in Plan]: string[] } = {
    BASIC: ['basic_features', 'contacts', 'conversations'],
    PRO: ['basic_features', 'contacts', 'conversations', 'analytics', 'campaigns', 'ai_assistance'],
    AGENCY: ['basic_features', 'contacts', 'conversations', 'analytics', 'campaigns', 'ai_assistance', 'team_management', 'white_label'],
  };

  return featureAccess[subscription.plan]?.includes(feature) || false;
}

export async function requireActiveSubscription(): Promise<UserSubscription> {
  const subscription = await getUserSubscription();
  
  if (!subscription || !subscription.isActive) {
    throw new Error('Active subscription required');
  }

  return subscription;
}

export async function getSubscriptionStatus(): Promise<{
  hasSubscription: boolean;
  plan?: Plan;
  status?: SubscriptionStatus;
  isActive: boolean;
}> {
  const subscription = await getUserSubscription();
  
  return {
    hasSubscription: !!subscription,
    plan: subscription?.plan,
    status: subscription?.status,
    isActive: subscription?.isActive || false,
  };
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