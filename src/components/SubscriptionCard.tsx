'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Crown, Zap, Star, ArrowUpRight } from 'lucide-react';
import { getClientUserSubscription, formatSubscriptionStatus, type ClientUserSubscription } from './ClientAuth';

const SubscriptionCard: React.FC = () => {
  const [subscription, setSubscription] = useState<ClientUserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const sub = await getClientUserSubscription();
        setSubscription(sub);
      } catch (err) {
        setError('Failed to load subscription data');
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleUpgrade = async (plan: 'PRO' | 'AGENCY', interval: 'MONTHLY' | 'YEARLY') => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: globalThis.JSON.stringify({ 
          plan: plan === 'PRO' ? 'pro' : 'agency', 
          interval: interval === 'MONTHLY' ? 'monthly' : 'yearly' 
        }),
      });

      if (!response.ok) throw new globalThis.Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to initiate upgrade. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new globalThis.Error('Failed to access billing portal');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert('Failed to access billing portal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-32 mb-6"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-sm border border-red-500/[0.2] rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'BASIC': return <Zap className="h-5 w-5" />;
      case 'PRO': return <Star className="h-5 w-5" />;
      case 'AGENCY': return <Crown className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BASIC': return 'text-blue-400 bg-blue-500/20';
      case 'PRO': return 'text-purple-400 bg-purple-500/20';
      case 'AGENCY': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-500/20';
      case 'TRIALING': return 'text-blue-400 bg-blue-500/20';
      case 'PAST_DUE': return 'text-yellow-400 bg-yellow-500/20';
      case 'CANCELED': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!subscription) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-500/20 rounded-lg">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">No Active Subscription</h3>
            <p className="text-sm text-gray-400">Choose a plan to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basic Plan */}
          <div className="bg-white/[0.02] border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-white font-medium">Basic</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">$29<span className="text-sm text-gray-400">/mo</span></div>
            <p className="text-sm text-gray-400 mb-4">Perfect for getting started</p>
            <button 
              onClick={() => handleUpgrade('PRO', 'MONTHLY')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all text-sm"
            >
              Choose Basic
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white/[0.02] border border-purple-500/50 rounded-lg p-4 relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">Popular</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">Pro</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">$99<span className="text-sm text-gray-400">/mo</span></div>
            <p className="text-sm text-gray-400 mb-4">Advanced features & AI</p>
            <button 
              onClick={() => handleUpgrade('PRO', 'MONTHLY')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-all text-sm"
            >
              Choose Pro
            </button>
          </div>

          {/* Agency Plan */}
          <div className="bg-white/[0.02] border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-medium">Agency</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">$199<span className="text-sm text-gray-400">/mo</span></div>
            <p className="text-sm text-gray-400 mb-4">Full features & team access</p>
            <button 
              onClick={() => handleUpgrade('AGENCY', 'MONTHLY')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded-lg transition-all text-sm font-medium"
            >
              Choose Agency
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${getPlanColor(subscription.plan)}`}>
          {getPlanIcon(subscription.plan)}
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">Subscription</h3>
          <p className="text-sm text-gray-400">Manage your plan and billing</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400">Current Plan</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(subscription.plan)}`}>
              {subscription.plan}
            </div>
          </div>
          <p className="text-white font-medium">{subscription.plan === 'BASIC' ? 'Basic' : subscription.plan === 'PRO' ? 'Pro' : 'Agency'} Plan</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400">Status</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
              {formatSubscriptionStatus(subscription.status)}
            </div>
          </div>
          <p className="text-white font-medium">{formatSubscriptionStatus(subscription.status)}</p>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white/[0.02] border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Billing Information</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Next billing date:</span>
            <span className="text-white">{subscription.currentPeriodEnd.toLocaleDateString()}</span>
          </div>
          
          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Subscription will cancel on {subscription.currentPeriodEnd.toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {subscription.plan !== 'AGENCY' && (
          <button 
            onClick={() => handleUpgrade(subscription.plan === 'BASIC' ? 'PRO' : 'AGENCY', 'MONTHLY')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            Upgrade Plan
          </button>
        )}
        
        <button 
          onClick={handleManageBilling}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-gray-700 text-white rounded-lg transition-all"
        >
          <CreditCard className="h-4 w-4" />
          Manage Billing
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard; 