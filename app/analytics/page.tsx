'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Award, Target, Users, Calendar } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import StatCard from '../../src/components/StatCard';

const Analytics: React.FC = () => {
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const metrics = [
    { 
      title: 'Total Sent', 
      value: '2,847', 
      change: '+12.3%', 
      trend: 'up' as const,
      description: 'Total emails sent across all campaigns this period.'
    },
    { 
      title: 'Open Rate', 
      value: '24.5%', 
      change: '+2.1%', 
      trend: 'up' as const,
      description: 'Percentage of recipients who opened your emails. Industry average: 22%.'
    },
    { 
      title: 'Reply Rate', 
      value: '8.2%', 
      change: '+0.8%', 
      trend: 'up' as const,
      description: 'Percentage of emails that received replies. Industry average: 5.1%.'
    },
    { 
      title: 'Meeting Rate', 
      value: '3.1%', 
      change: '-0.2%', 
      trend: 'down' as const,
      description: 'Percentage of emails that resulted in booked meetings. Industry average: 2.1%.'
    },
    { 
      title: 'Avg Response Time', 
      value: '4.2h', 
      change: '-1.2h', 
      trend: 'up' as const,
      description: 'Average time between sending and receiving a reply.'
    },
    { 
      title: 'Active Campaigns', 
      value: '12', 
      change: '+2', 
      trend: 'up' as const,
      description: 'Number of currently running outreach campaigns.'
    },
  ];

  // Benchmark data for comparison
  const benchmarks = [
    { metric: 'Open Rate', yourValue: 24.5, industryAvg: 22.0, isAbove: true },
    { metric: 'Reply Rate', yourValue: 8.2, industryAvg: 5.1, isAbove: true },
    { metric: 'Meeting Rate', yourValue: 3.1, industryAvg: 2.1, isAbove: true },
  ];

  // Top performing campaign data
  const topCampaign = {
    name: 'Q4 SaaS Outreach',
    openRate: '31.2%',
    replyRate: '12.1%',
    meetingsBooked: 47,
    totalSent: 892,
  };

  return (
    <DashboardLayout>
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
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none ${
                  period === selectedPeriod
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

      {/* Top Performing Campaign Summary */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Award className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top Performing Campaign</h3>
                <p className="text-sm text-gray-400">{topCampaign.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Sent</p>
              <p className="text-xl font-semibold text-white">{topCampaign.totalSent.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">Open Rate</span>
              </div>
              <p className="text-2xl font-semibold text-white">{topCampaign.openRate}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-400">Reply Rate</span>
              </div>
              <p className="text-2xl font-semibold text-white">{topCampaign.replyRate}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-400">Meetings Booked</span>
              </div>
              <p className="text-2xl font-semibold text-white">{topCampaign.meetingsBooked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <StatCard key={index} {...metric} />
        ))}
      </div>

      {/* Benchmark Indicators */}
      <div className="mb-8">
        <h3 className="text-xl font-medium text-white mb-6 tracking-tight">Industry Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benchmarks.map((benchmark, index) => (
            <div key={index} className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-400">{benchmark.metric}</h4>
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                  benchmark.isAbove 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {benchmark.isAbove ? '↑ Above' : '↓ Below'} Avg
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Your Performance</span>
                  <span className="text-lg font-semibold text-white">{benchmark.yourValue}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Industry Average</span>
                  <span className="text-sm text-gray-500">{benchmark.industryAvg}%</span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      benchmark.isAbove ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min((benchmark.yourValue / benchmark.industryAvg) * 50, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section with Toggle */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.03] transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-white tracking-tight">Performance Trend</h3>
          
          {/* Chart View Toggle */}
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-lg p-1">
            <button
              onClick={() => setChartView('bar')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                chartView === 'bar'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartView('line')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                chartView === 'line'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              📊 {chartView === 'bar' ? 'Bar' : 'Line'} chart visualization coming soon
            </p>
            <p className="text-gray-500 text-xs">Install Recharts or Chart.js for interactive charts</p>
            <button className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm">
              Install Chart Library
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic'; 