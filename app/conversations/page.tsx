'use client';

import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import ThreadPreview from '../../src/components/ThreadPreview';

// Mock data moved outside component to avoid useMemo dependency warning
const mockThreads = [
    {
      id: '1',
      recipientName: 'Sarah Johnson',
      recipientCompany: 'TechCorp Inc.',
      lastMessage: 'Thanks for reaching out! I\'d be interested in learning more about your solution.',
      timestamp: '2 hours ago',
      status: 'replied' as const,
      unreadCount: 1,
      urgency: 'high' as const, // New field
      responseTime: 24, // Hours to respond
    },
    {
      id: '2',
      recipientName: 'Michael Chen',
      recipientCompany: 'StartupXYZ',
      lastMessage: 'Hi there! I\'m currently evaluating solutions like yours. Could we schedule a quick call?',
      timestamp: '5 hours ago',
      status: 'replied' as const,
      unreadCount: 1,
      urgency: 'medium' as const,
      responseTime: 48,
    },
    {
      id: '3',
      recipientName: 'Emily Rodriguez',
      recipientCompany: 'Enterprise Solutions',
      lastMessage: 'Your cold email about improving our sales process caught my attention...',
      timestamp: '1 day ago',
      status: 'replied' as const,
      unreadCount: 0,
      urgency: 'low' as const,
      responseTime: 72,
    },
    {
      id: '4',
      recipientName: 'David Kim',
      recipientCompany: 'Innovation Labs',
      lastMessage: 'Thanks for the follow-up email. I\'ll discuss this with my team and get back to you.',
      timestamp: '2 days ago',
      status: 'sent' as const,
      unreadCount: 0,
      urgency: 'medium' as const,
      responseTime: 24,
    },
    {
      id: '5',
      recipientName: 'Lisa Thompson',
      recipientCompany: 'Growth Co.',
      lastMessage: 'I saw your email about automating our outreach. Let\'s connect next week.',
      timestamp: '3 days ago',
      status: 'replied' as const,
      unreadCount: 0,
      urgency: 'low' as const,
      responseTime: 96,
    },
  ];

const Conversations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Filter and search logic
  const filteredThreads = useMemo(() => {
    let filtered = mockThreads;

    // Apply status filter
    if (activeFilter === 'Unread') {
      filtered = filtered.filter(thread => thread.unreadCount > 0);
    } else if (activeFilter === 'Replied') {
      filtered = filtered.filter(thread => thread.status === 'replied');
    } else if (activeFilter === 'Pending') {
      filtered = filtered.filter(thread => thread.status === 'sent');
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(thread =>
        thread.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.recipientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery, activeFilter, mockThreads]);

  const getUrgencyIndicator = (urgency: 'high' | 'medium' | 'low', responseTime: number) => {
    if (urgency === 'high') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle className="h-3 w-3 text-red-400" />
          <span className="text-xs text-red-400 font-medium">High Priority</span>
        </div>
      );
    }
    
    if (responseTime <= 24) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
          <Clock className="h-3 w-3 text-orange-400" />
          <span className="text-xs text-orange-400 font-medium">{responseTime}h to reply</span>
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Conversations</h1>
        <p className="text-gray-400 text-base font-light">
          Manage your email conversations and follow-ups
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by sender, company, or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="mb-10 flex items-center space-x-4">
        <div className="flex space-x-2">
          {['All', 'Unread', 'Replied', 'Pending'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none ${
                filter === activeFilter
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-md'
                  : 'bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
              }`}
            >
              {filter}
              {filter === 'Unread' && mockThreads.filter(t => t.unreadCount > 0).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {mockThreads.filter(t => t.unreadCount > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex-1"></div>
        
        <select className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm">
          <option value="recent" className="bg-[#1a1a1a]">Most Recent</option>
          <option value="oldest" className="bg-[#1a1a1a]">Oldest First</option>
          <option value="unread" className="bg-[#1a1a1a]">Unread First</option>
          <option value="priority" className="bg-[#1a1a1a]">Priority First</option>
        </select>
      </div>

      {/* Conversations List */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl overflow-hidden hover:bg-white/[0.03] transition-all duration-300">
        <div className="divide-y divide-white/[0.05]">
          {filteredThreads.map((thread) => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`transition-all duration-200 cursor-pointer ${
                selectedThreadId === thread.id
                  ? 'bg-blue-500/10 border-l-4 border-blue-500'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <ThreadPreview 
                      id={+thread.id}
                      sender={thread.recipientName}
                      company={thread.recipientCompany}
                      subject={`Re: Cold Outreach - ${thread.recipientCompany}`}
                      preview={thread.lastMessage}
                      time={thread.timestamp}
                      isUnread={thread.unreadCount > 0}
                    />
                  </div>
                </div>
                
                {/* Urgency and Response Time Indicators */}
                <div className="flex items-center gap-2 mt-3">
                  {getUrgencyIndicator(thread.urgency, thread.responseTime)}
                  {thread.status === 'replied' && (
                    <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                      <span className="text-xs text-green-400 font-medium">✓ Replied</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Empty State */}
      {filteredThreads.length === 0 && (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-medium text-white mb-4">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-gray-400">
            {searchQuery 
              ? `No results found for "${searchQuery}". Try a different search term.`
              : 'Start a new campaign to begin engaging with prospects'
            }
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Conversations; 