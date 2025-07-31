'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../src/components/DashboardLayout';
import StatCard from '../../src/components/StatCard';

const Dashboard: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  const statData = [
    {
      title: 'Open Rate',
      value: '24.5%',
      change: '+2.1%',
      trend: 'up' as const,
    },
    {
      title: 'Meetings Booked',
      value: '127',
      change: '+12',
      trend: 'up' as const,
    },
    {
      title: 'Replies',
      value: '1,429',
      change: '-3.2%',
      trend: 'down' as const,
    },
  ];

  const threadData = [
    {
      id: 1,
      sender: 'Sarah Johnson',
      company: 'TechCorp',
      subject: 'Re: Partnership Opportunity',
      preview: 'Thanks for reaching out! I would love to discuss this further...',
      time: '2 min ago',
      isUnread: true,
      status: 'replied' as const,
    },
    {
      id: 2,
      sender: 'Michael Chen',
      company: 'StartupXYZ',
      subject: 'Demo Request',
      preview: 'Could we schedule a demo for next week? Our team is...',
      time: '1 hour ago',
      isUnread: true,
      status: 'opened' as const,
    },
    {
      id: 3,
      sender: 'Emma Davis',
      company: 'BigCorp Inc',
      subject: 'Re: Cold Outreach',
      preview: 'I appreciate your message, but we are not looking for...',
      time: '3 hours ago',
      isUnread: false,
      status: 'no_response' as const,
    },
    {
      id: 4,
      sender: 'John Smith',
      company: 'GrowthCo',
      subject: 'Interested in Learning More',
      preview: 'Your solution sounds exactly like what we need...',
      time: '1 day ago',
      isUnread: false,
      status: 'replied' as const,
    },
  ];

  const campaigns = ['All Campaigns', 'Q4 SaaS Outreach', 'Holiday Campaign', 'New Year Follow-up'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replied':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Replied
          </span>
        );
      case 'opened':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Opened
          </span>
        );
      case 'no_response':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
            No Response
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-400 text-base font-light">
              Welcome back! Here&apos;s what&apos;s happening with your campaigns.
            </p>
          </div>

          {/* Campaign Filter */}
          <div className="mb-10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-300">Campaign:</span>
              <select 
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
              >
                {campaigns.map((campaign, index) => (
                  <option key={index} value={campaign.toLowerCase().replace(/\s+/g, '_')} className="bg-[#1a1a1a]">
                    {campaign}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {statData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Recent Threads Section */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.03] transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Recent Conversations
              </h2>
              <button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
                View all
              </button>
            </div>
            
            <div className="space-y-3">
              {threadData.map((thread) => (
                <div 
                  key={thread.id}
                  className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-white font-medium text-sm">
                          {thread.sender}
                        </h4>
                        <span className="text-gray-600">·</span>
                        <span className="text-sm text-gray-400">{thread.company}</span>
                        {getStatusBadge(thread.status)}
                        {thread.isUnread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-gray-200 mb-2">
                        {thread.subject}
                      </p>
                      
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {thread.preview}
                      </p>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-medium">{thread.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 