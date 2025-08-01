import React from 'react';
import { MagnifyingGlassIcon, BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TopbarProps {}

// 🚨 AUDIT IMPROVEMENT: Billing Status Badge Component
const BillingStatusBadge = () => {
  // Mock data - replace with actual subscription status
  const status = 'TRIALING'; // TRIALING, ACTIVE, PAST_DUE, CANCELED
  const daysLeft = 5;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TRIALING':
        return {
          text: `${daysLeft} days left`,
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          icon: ExclamationTriangleIcon,
        };
      case 'PAST_DUE':
        return {
          text: 'Payment Due',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          icon: ExclamationTriangleIcon,
        };
      case 'ACTIVE':
        return {
          text: 'Pro Plan',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          icon: null,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig(status);
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 ${config.bgColor} ${config.textColor}`}>
      {IconComponent && <IconComponent className="h-3 w-3" />}
      <span>{config.text}</span>
    </div>
  );
};

const Topbar: React.FC<TopbarProps> = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations, contacts..."
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* 🚨 AUDIT IMPROVEMENT: Billing Status Indicator */}
          <BillingStatusBadge />

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-0">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-3 border-l border-gray-700">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
            <span className="text-gray-200 text-sm font-medium">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar; 