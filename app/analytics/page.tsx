'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';

const Analytics: React.FC = () => {
  const metrics = [
    { title: 'Total Sent', value: '2,847', change: '+12.3%', trend: 'up' as const },
    { title: 'Open Rate', value: '24.5%', change: '+2.1%', trend: 'up' as const },
    { title: 'Reply Rate', value: '8.2%', change: '+0.8%', trend: 'up' as const },
    { title: 'Meeting Rate', value: '3.1%', change: '-0.2%', trend: 'down' as const },
    { title: 'Avg Response Time', value: '4.2h', change: '-1.2h', trend: 'up' as const },
    { title: 'Active Campaigns', value: '12', change: '+2', trend: 'up' as const },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-white mb-1">Analytics</h1>
            <p className="text-gray-400 text-sm">
              Track your campaign performance and engagement metrics
            </p>
          </div>

          {/* Campaign and Time Period Selectors */}
          <div className="mb-6 space-y-4">
            {/* Campaign Filter */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Campaign:</span>
              <select className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="all">All Campaigns</option>
                <option value="q4-saas">Q4 SaaS Outreach</option>
                <option value="holiday">Holiday Campaign</option>
                <option value="new-year">New Year Follow-up</option>
              </select>
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Period:</span>
              <div className="flex space-x-2">
                {['7d', '30d', '90d', 'All time'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-0 ${
                      period === '30d'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {metrics.map((metric, index) => (
              <StatCard key={index} {...metric} />
            ))}
          </div>

          {/* Placeholder for charts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-card">
            <h3 className="text-lg font-medium text-white mb-4">Performance Trend</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">📊 Chart visualization coming soon</p>
                <p className="text-gray-600 text-xs mt-2">Install Recharts or Chart.js for interactive charts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics; 