'use client';

import { useUser } from '@clerk/nextjs';

export type Plan = 'BASIC' | 'PRO' | 'AGENCY';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export interface ClientUserSubscription {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

export async function getClientUserSubscription(): Promise<ClientUserSubscription | null> {
  try {
    const response = await fetch('/api/user/subscription');
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new globalThis.Error('Failed to fetch subscription');
    }
    
    const data = await response.json();
    
    if (!data) return null;
    
    return {
      ...data,
      currentPeriodEnd: new globalThis.Date(data.currentPeriodEnd),
      isActive: ['TRIALING', 'ACTIVE'].includes(data.status),
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
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