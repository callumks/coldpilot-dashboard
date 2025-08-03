'use client';

import React from 'react';
import { Crown, Zap, CheckCircle } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  hasSubscription: boolean;
  currentPlan?: string;
  requiredPlan?: 'BASIC' | 'PRO' | 'AGENCY';
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  children, 
  hasSubscription, 
  currentPlan,
  requiredPlan = 'BASIC'
}) => {
  if (hasSubscription && (!requiredPlan || currentPlan === requiredPlan || 
      (requiredPlan === 'BASIC' && ['BASIC', 'PRO', 'AGENCY'].includes(currentPlan || '')) ||
      (requiredPlan === 'PRO' && ['PRO', 'AGENCY'].includes(currentPlan || '')))) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    // Redirect to pricing/checkout
    window.location.href = '/pricing';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <Crown className="h-8 w-8 text-white" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {hasSubscription ? 'Upgrade Required' : 'Subscription Required'}
        </h2>

        {/* Message */}
        <p className="text-gray-400 mb-6">
          {hasSubscription 
            ? `This feature requires ${requiredPlan} plan or higher. You're currently on ${currentPlan} plan.`
            : 'To access ColdPilot features, please choose a subscription plan that fits your needs.'
          }
        </p>

        {/* Features List */}
        <div className="text-left mb-8 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-gray-300">AI-powered lead sourcing</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-gray-300">GPT-4o email generation</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-gray-300">Campaign automation</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-gray-300">Advanced analytics</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {hasSubscription ? 'Upgrade Plan' : 'Choose Plan'}
        </button>

        {/* Secondary link */}
        <p className="text-sm text-gray-500 mt-4">
          Questions? <a href="/support" className="text-blue-400 hover:text-blue-300">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGate;