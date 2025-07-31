'use client';

import React from 'react';
import DashboardLayout from '../../src/components/DashboardLayout';
import ThreadPreview from '../../src/components/ThreadPreview';

const Conversations: React.FC = () => {
  const mockThreads = [
    {
      id: '1',
      recipientName: 'Sarah Johnson',
      recipientCompany: 'TechCorp Inc.',
      lastMessage: 'Thanks for reaching out! I\'d be interested in learning more about your solution.',
      timestamp: '2 hours ago',
      status: 'replied' as const,
      unreadCount: 1,
    },
    {
      id: '2',
      recipientName: 'Michael Chen',
      recipientCompany: 'StartupXYZ',
      lastMessage: 'Hi there! I\'m currently evaluating solutions like yours. Could we schedule a quick call?',
      timestamp: '5 hours ago',
      status: 'replied' as const,
      unreadCount: 1,
    },
    {
      id: '3',
      recipientName: 'Emily Rodriguez',
      recipientCompany: 'Enterprise Solutions',
      lastMessage: 'Your cold email about improving our sales process caught my attention...',
      timestamp: '1 day ago',
      status: 'replied' as const,
      unreadCount: 0,
    },
    {
      id: '4',
      recipientName: 'David Kim',
      recipientCompany: 'Innovation Labs',
      lastMessage: 'Thanks for the follow-up email. I\'ll discuss this with my team and get back to you.',
      timestamp: '2 days ago',
      status: 'sent' as const,
      unreadCount: 0,
    },
    {
      id: '5',
      recipientName: 'Lisa Thompson',
      recipientCompany: 'Growth Co.',
      lastMessage: 'I saw your email about automating our outreach. Let\'s connect next week.',
      timestamp: '3 days ago',
      status: 'replied' as const,
      unreadCount: 0,
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Conversations</h1>
        <p className="text-gray-400 text-base font-light">
          Manage your email conversations and follow-ups
        </p>
      </div>

      {/* Filters */}
      <div className="mb-10 flex items-center space-x-4">
        <div className="flex space-x-2">
          {['All', 'Unread', 'Replied', 'Pending'].map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none ${
                filter === 'All'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="flex-1"></div>
        
        <select className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm">
          <option value="recent" className="bg-[#1a1a1a]">Most Recent</option>
          <option value="oldest" className="bg-[#1a1a1a]">Oldest First</option>
          <option value="unread" className="bg-[#1a1a1a]">Unread First</option>
        </select>
      </div>

      {/* Conversations List */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl overflow-hidden hover:bg-white/[0.03] transition-all duration-300">
        <div className="divide-y divide-white/[0.05]">
          {mockThreads.map((thread) => (
            <ThreadPreview 
              key={thread.id}
              id={+thread.id}
              sender={thread.recipientName}
              company={thread.recipientCompany}
              subject={`Re: Cold Outreach - ${thread.recipientCompany}`}
              preview={thread.lastMessage}
              time={thread.timestamp}
              isUnread={thread.unreadCount > 0}
            />
          ))}
        </div>
      </div>

      {/* Empty state (when no conversations) */}
      {mockThreads.length === 0 && (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-medium text-white mb-4">No conversations yet</h3>
          <p className="text-gray-400">Start a new campaign to begin engaging with prospects</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Conversations; 