'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';

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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Replied
          </span>
        );
      case 'opened':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Opened
          </span>
        );
      case 'no_response':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            No Response
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 font-inter">
              Dashboard
            </h1>
            <p className="text-gray-400 text-base">
              Welcome back! Here&apos;s what&apos;s happening with your campaigns.
            </p>
          </div>

          {/* Campaign Filter */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-300">Current Campaign:</span>
              <select 
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {campaigns.map((campaign, index) => (
                  <option key={index} value={campaign.toLowerCase().replace(/\s+/g, '_')}>
                    {campaign}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Recent Threads */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white font-inter">
                  Recent Threads
                </h2>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  View all
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-700">
              {threadData.map((thread) => (
                <div 
                  key={thread.id}
                  className="p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-semibold text-white">
                          {thread.sender}
                        </h4>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-400">{thread.company}</span>
                        {getStatusBadge(thread.status)}
                        {thread.isUnread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-white mb-2">
                        {thread.subject}
                      </p>
                      
                      <p className="text-sm text-gray-400 line-clamp-1">
                        {thread.preview}
                      </p>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500">{thread.time}</span>
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