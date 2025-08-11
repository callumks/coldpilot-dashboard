'use client';

import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import ThreadPreview from '../../src/components/ThreadPreview';
import ConversationDetail from '../../src/components/ConversationDetail';

interface Conversation {
  id: string;
  recipientName: string;
  recipientCompany: string;
  recipientEmail: string;
  lastMessage: string;
  timestamp: string;
  status: 'replied' | 'sent' | 'opened' | 'delivered';
  unreadCount: number;
  urgency: 'high' | 'medium' | 'low';
  responseTime: number;
  subject: string;
  campaignName: string | null;
  contactStatus: string;
}

const Conversations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('recent');

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations();
  }, [searchQuery, activeFilter, sortBy]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'All') params.append('filter', activeFilter);
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await fetch(`/api/conversations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Conversations are now fetched and filtered via API

  // Removed per request (no urgency/"0h to reply" chips)
  const getUrgencyIndicator = () => null;

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
              {filter === 'Unread' && conversations.filter(t => t.unreadCount > 0).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {conversations.filter(t => t.unreadCount > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex-1"></div>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
        >
          <option value="recent" className="bg-[#1a1a1a]">Most Recent</option>
          <option value="oldest" className="bg-[#1a1a1a]">Oldest First</option>
          <option value="unread" className="bg-[#1a1a1a]">Unread First</option>
          <option value="priority" className="bg-[#1a1a1a]">Priority First</option>
        </select>
      </div>

      {/* Split view: list left, detail right */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] h-[70vh]">
        {/* Left column: conversations list with its own scroller */}
        <div className="min-w-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-400 mb-2">Error loading conversations</h3>
            <p className="text-red-500 mb-6">{error}</p>
            <button
              onClick={fetchConversations}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-white/[0.05]">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => setSelectedThreadId(conversation.id)}
                className={`transition-all duration-200 cursor-pointer ${
                  selectedThreadId === conversation.id
                    ? 'bg-blue-500/10 border-l-4 border-blue-500'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <ThreadPreview 
                        id={parseInt(conversation.id.substring(0, 8), 16)} // Convert string ID to number for compatibility
                        sender={conversation.recipientName}
                        company={conversation.recipientCompany}
                        subject={conversation.subject}
                        preview={conversation.lastMessage}
                        time={conversation.timestamp}
                        isUnread={conversation.unreadCount > 0}
                      />
                    </div>
                  </div>
                  
                  {/* Campaign and Contact Status */}
                  <div className="flex items-center gap-2 mb-3">
                    {conversation.campaignName && (
                      <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md">
                        <span className="text-xs text-purple-400 font-medium">📧 {conversation.campaignName}</span>
                      </div>
                    )}
                    <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <span className="text-xs text-blue-400 font-medium">{conversation.contactStatus.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {/* Status indicator only */}
                  <div className="flex items-center gap-2 mt-3">
                    {conversation.status === 'replied' && (
                      <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                        <span className="text-xs text-green-400 font-medium">✓ Replied</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <h3 className="text-xl font-medium text-white mb-4">No conversations yet</h3>
            <p className="text-gray-400 mb-6">Start a campaign to begin engaging with prospects</p>
            <button
              onClick={() => window.location.href = '/campaigns'}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Create Campaign
            </button>
          </div>
        )}
        </div>
        {/* Right column: detail has its own internal scroller */}
        {/* Detail panel */}
        <ConversationDetail selectedThreadId={selectedThreadId} />
      </div>

      {/* Enhanced Empty State */}
      {!loading && !error && conversations.length === 0 && searchQuery && (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-medium text-white mb-4">No conversations found</h3>
          <p className="text-gray-400 mb-6">
            No results found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
          </p>
          <button 
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
          >
            Clear search
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Conversations;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic'; 