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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-white mb-1">Conversations</h1>
            <p className="text-gray-400 text-sm">
              Manage your email conversations and follow-ups
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex space-x-2">
              {['All', 'Unread', 'Replied', 'Pending'].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-0 ${
                    filter === 'All'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="flex-1"></div>
            
            <select className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>

          {/* Conversations List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-card">
            <div className="divide-y divide-gray-800">
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-card text-center">
              <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
              <p className="text-gray-400">Start your first cold email campaign to see conversations here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Conversations; 