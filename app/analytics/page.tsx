'use client';

import React from 'react';
import DashboardLayout from '../../src/components/DashboardLayout';
import StatCard from '../../src/components/StatCard';

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
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Analytics</h1>
            <p className="text-gray-400 text-base font-light">
              Track your campaign performance and engagement metrics
            </p>
          </div>

          {/* Campaign and Time Period Selectors */}
          <div className="mb-10 space-y-6">
            {/* Campaign Filter */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">Campaign:</span>
              <select className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm">
                <option value="all" className="bg-[#1a1a1a]">All Campaigns</option>
                <option value="q4-saas" className="bg-[#1a1a1a]">Q4 SaaS Outreach</option>
                <option value="holiday" className="bg-[#1a1a1a]">Holiday Campaign</option>
                <option value="new-year" className="bg-[#1a1a1a]">New Year Follow-up</option>
              </select>
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">Period:</span>
              <div className="flex space-x-2">
                {['7d', '30d', '90d', 'All time'].map((period) => (
                  <button
                    key={period}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none ${
                      period === '30d'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {metrics.map((metric, index) => (
              <StatCard key={index} {...metric} />
            ))}
          </div>

          {/* Placeholder for charts */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.03] transition-all duration-300">
            <h3 className="text-xl font-medium text-white mb-6 tracking-tight">Performance Trend</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">📊 Chart visualization coming soon</p>
                <p className="text-gray-500 text-xs">Install Recharts or Chart.js for interactive charts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics; 