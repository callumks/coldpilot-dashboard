'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Search, Filter, Users, Mail, Calendar, MoreVertical, X, Download, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import CSVUpload from '../../src/components/CSVUpload';
import AddContactModal from '../../src/components/AddContactModal';
import LeadScoreIndicator from '../../src/components/LeadScoreIndicator';
import ContactQuickActions from '../../src/components/ContactQuickActions';
import SmartTagsSuggestion from '../../src/components/SmartTagsSuggestion';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  source: string;
  status: string;
  lastContacted: string | null;
  tags: string[];
  notes: string | null;
  linkedinUrl: string | null;
  phoneNumber: string | null;
  createdAt: string;
  activeCampaigns: number;
  lastConversation: any;
}

interface LeadSource {
  source: string;
  count: number;
  percentage: number;
}

const Contacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts from API
  useEffect(() => {
    fetchContacts();
  }, [refreshTrigger, searchQuery, selectedFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedFilter !== 'All') params.append('status', selectedFilter);
      
      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
        setLeadSources(data.leadSources || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // Contact action handlers
  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleMessageContact = (contact: any) => {
    alert(`🚀 Messaging ${contact.name} coming soon! This will integrate with our campaign system.`);
  };

  const handleDeleteContact = (contactId: string) => {
    // In a real app, this would call an API
    console.log('Delete contact:', contactId);
    alert('🗑️ Contact deletion will be implemented with proper API integration.');
  };

  const handleUpdateContactTags = (contactId: string, newTags: string[]) => {
    // In a real app, this would update the contact in the database
    console.log('Update tags for contact:', contactId, newTags);
    // TODO: Implement contact update API
    alert('🔄 Contact tag updates will be implemented in the next iteration');
  };

  const handleDownloadCSV = async () => {
    try {
      console.log('📥 Starting CSV download...');
      const response = await fetch('/api/contacts/export');
      
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ CSV download completed');
    } catch (error) {
      console.error('💥 CSV download error:', error);
      alert('Failed to download CSV. Please try again.');
    }
  };

  // Contacts are now fetched from API in useEffect

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONTACTED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'REPLIED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'INTERESTED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MEETING_SCHEDULED': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'CLOSED_WON': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CLOSED_LOST': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'COLD': 
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatLastContacted = (lastContacted: string | null) => {
    if (!lastContacted) return 'Never';
    
    const date = new Date(lastContacted);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium"
        >
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
        <button 
          onClick={() => alert('🚀 Bulk Email coming soon! We\'re building this feature as part of the campaign system.')}
          className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-white rounded-xl transition-all duration-200 font-medium"
        >
          <Mail className="h-4 w-4" />
          Bulk Email
        </button>
        
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-white rounded-xl transition-all duration-200 font-medium"
        >
          <Download className="h-4 w-4" />
          Download CSV
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
            placeholder="Search by name, company, email, or tags (e.g. 'Founder', 'Tech', 'C-Level')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                🏷️ Tag search
              </span>
            </div>
          )}
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
            <option value="COLD" className="bg-[#1a1a1a]">Cold</option>
            <option value="CONTACTED" className="bg-[#1a1a1a]">Contacted</option>
            <option value="REPLIED" className="bg-[#1a1a1a]">Replied</option>
            <option value="INTERESTED" className="bg-[#1a1a1a]">Interested</option>
            <option value="MEETING_SCHEDULED" className="bg-[#1a1a1a]">Meeting Scheduled</option>
            <option value="CLOSED_WON" className="bg-[#1a1a1a]">Closed Won</option>
            <option value="CLOSED_LOST" className="bg-[#1a1a1a]">Closed Lost</option>
          </select>
        </div>
      </div>

      {/* Contacts Table/List */}
      {loading ? (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading contacts...</p>
        </div>
      ) : error ? (
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-400 mb-2">Error loading contacts</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={fetchContacts}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      ) : contacts.length > 0 ? (
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
                {contacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-white/[0.02] transition-colors"
                    onMouseEnter={() => setHoveredContactId(contact.id)}
                    onMouseLeave={() => setHoveredContactId(null)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{contact.name}</p>
                            <LeadScoreIndicator 
                              contact={{
                                company: contact.company || undefined,
                                position: contact.position || contact.status, // Using status as position for demo
                                email: contact.email,
                                source: contact.source,
                                lastContacted: contact.lastContacted || undefined
                              }}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{contact.company || 'No company'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{contact.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-400">{formatLastContacted(contact.lastContacted)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(contact.status)}`}>
                        {contact.status.replace('_', ' ')}
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
                      <ContactQuickActions
                        contact={{
                          id: parseInt(contact.id) || 0, // Convert string to number for compatibility
                          name: contact.name,
                          email: contact.email,
                          company: contact.company || undefined
                        }}
                        onEdit={(contact: any) => handleEditContact({
                          ...contact,
                          id: contact.id.toString() // Convert back to string for our handler
                        })}
                        onMessage={handleMessageContact}
                        onDelete={(contactId: number) => handleDeleteContact(contactId.toString())}
                        isVisible={hoveredContactId === contact.id}
                      />
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

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onContactAdded={(contact) => {
            console.log('Contact added:', contact);
            setRefreshTrigger(prev => prev + 1);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Contact Modal */}
      {showEditModal && editingContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Edit Contact</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <SmartTagsSuggestion
                  contact={{
                    company: editingContact.company,
                    position: editingContact.status, // Using status as position for demo
                    email: editingContact.email
                  }}
                  existingTags={editingContact.tags || []}
                  onTagsChange={(newTags) => handleUpdateContactTags(editingContact.id, newTags)}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('💾 Contact updates will be saved to the database when the backend is connected.');
                    setShowEditModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Contacts;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic'; 