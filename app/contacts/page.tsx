'use client';

import React, { useState } from 'react';
import { Plus, Upload, Search, Filter, Users, Mail, Calendar, MoreVertical } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import CSVUpload from '../../src/components/CSVUpload';

const Contacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mock contact data
  const contacts = [
    {
      id: 1,
      name: 'Sarah Johnson',
      company: 'TechCorp Inc.',
      email: 'sarah.johnson@techcorp.com',
      source: 'LinkedIn',
      lastContacted: '2 days ago',
      status: 'Active',
      tags: ['Decision Maker', 'SaaS'],
    },
    {
      id: 2,
      name: 'Michael Chen',
      company: 'StartupXYZ',
      email: 'michael@startupxyz.io',
      source: 'Cold Email',
      lastContacted: '1 week ago',
      status: 'Replied',
      tags: ['Founder', 'Tech'],
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      company: 'Enterprise Solutions',
      email: 'emily.rodriguez@enterprise.com',
      source: 'Referral',
      lastContacted: '3 days ago',
      status: 'Interested',
      tags: ['VP Sales', 'Enterprise'],
    },
    {
      id: 4,
      name: 'David Kim',
      company: 'Innovation Labs',
      email: 'david.kim@innovationlabs.com',
      source: 'Event',
      lastContacted: '5 days ago',
      status: 'Cold',
      tags: ['CTO', 'AI/ML'],
    },
  ];

  // Filter contacts based on search and status
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || contact.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Lead source data
  const leadSources = [
    { source: 'LinkedIn', count: 45, percentage: 35 },
    { source: 'Cold Email', count: 32, percentage: 25 },
    { source: 'Referral', count: 28, percentage: 22 },
    { source: 'Event', count: 23, percentage: 18 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Replied': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Interested': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Cold': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Contacts</h1>
        <p className="text-gray-400 text-base font-light">
          Manage your prospect database and track engagement
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <button className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium">
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-white rounded-xl transition-all duration-200 font-medium"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
        <button className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-white rounded-xl transition-all duration-200 font-medium">
          <Mail className="h-4 w-4" />
          Bulk Email
        </button>
      </div>

      {/* Leads by Source Cards */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Leads by Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leadSources.map((source, index) => (
            <div key={index} className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-400">{source.source}</span>
                <span className="text-xs text-gray-500">{source.percentage}%</span>
              </div>
              <p className="text-2xl font-semibold text-white">{source.count}</p>
              <div className="mt-3 w-full bg-gray-800 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${source.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          >
            <option value="All" className="bg-[#1a1a1a]">All Status</option>
            <option value="Active" className="bg-[#1a1a1a]">Active</option>
            <option value="Replied" className="bg-[#1a1a1a]">Replied</option>
            <option value="Interested" className="bg-[#1a1a1a]">Interested</option>
            <option value="Cold" className="bg-[#1a1a1a]">Cold</option>
          </select>
        </div>
      </div>

      {/* Contacts Table/List */}
      {filteredContacts.length > 0 ? (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Company</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Source</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Contacted</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Tags</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{contact.company}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{contact.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-400">{contact.lastContacted}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1 hover:bg-white/[0.05] rounded-md transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? `No results found for "${searchQuery}". Try a different search term.`
                  : 'Start building your prospect database by adding contacts or importing from a CSV file.'
                }
              </p>
            </div>
            
            {!searchQuery && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium">
                  <Plus className="h-4 w-4" />
                  Add Your First Contact
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-white rounded-xl transition-all duration-200 font-medium">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </button>
              </div>
            )}
            
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <CSVUpload
          onUploadComplete={(result) => {
            console.log('Upload completed:', result);
            setRefreshTrigger(prev => prev + 1);
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default Contacts;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic'; 