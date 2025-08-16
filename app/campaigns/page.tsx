'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Play, Pause, BarChart3, Users, Mail, 
  Calendar, MoreVertical, Edit3, Trash2, Copy,
  TrendingUp, Clock, Target, AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import CampaignCreationWizard from '../../src/components/CampaignCreationWizard';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  channel: string;
  totalContacts: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
  startDate: string | null;
  steps: number;
}

const Campaigns: React.FC = () => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'text-green-400 bg-green-500/10 border-green-500/20',
          icon: Play,
          label: 'Active'
        };
      case 'PAUSED':
        return {
          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
          icon: Pause,
          label: 'Paused'
        };
      case 'COMPLETED':
        return {
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          icon: BarChart3,
          label: 'Completed'
        };
      default: // DRAFT
        return {
          color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
          icon: Edit3,
          label: 'Draft'
        };
    }
  };

  const handleCampaignCreated = (newCampaign: any) => {
    console.log('Campaign created:', newCampaign);
    setShowCreateWizard(false);
    // Refresh campaigns list from API
    fetchCampaigns();
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      if (action === 'pause') {
        const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaignId, status: 'PAUSED' }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Pause failed');
        await fetchCampaigns();
        return;
      }
      if (action === 'resume') {
        const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaignId, status: 'ACTIVE' }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Resume failed');
        await fetchCampaigns();
        return;
      }
      if (action === 'launch') {
        const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaignId, status: 'ACTIVE' }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Launch failed');
        await fetchCampaigns();
        return;
      }
      if (action === 'analytics') {
        window.location.href = `/analytics?campaignId=${campaignId}`;
        return;
      }
      if (action === 'delete') {
        const res = await fetch(`/api/campaigns?id=${campaignId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Delete failed');
        await fetchCampaigns();
        return;
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const totalStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
    totalContacts: campaigns.reduce((sum, c) => sum + c.totalContacts, 0),
    avgOpenRate: campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length 
      : 0,
    avgReplyRate: campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.replyRate, 0) / campaigns.length 
      : 0
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
        </div>
        <p className="text-gray-400">Manage your outreach campaigns and track performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalStats.totalCampaigns}</p>
              <p className="text-sm text-gray-400">Total Campaigns</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Play className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalStats.activeCampaigns}</p>
              <p className="text-sm text-gray-400">Active Campaigns</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalStats.totalContacts.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Contacts</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Mail className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalStats.avgOpenRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Avg Open Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalStats.avgReplyRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Avg Reply Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.05]">
          <h2 className="text-lg font-medium text-white">All Campaigns</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-400 mb-2">Error loading campaigns</h3>
            <p className="text-red-500 mb-6">{error}</p>
            <button
              onClick={fetchCampaigns}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">Create your first campaign to start reaching out to prospects</p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Campaign</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contacts</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Sent</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Opened</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Replied</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Open Rate</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Reply Rate</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {campaigns.map((campaign) => {
                  const statusConfig = getStatusConfig(campaign.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{campaign.name}</p>
                          <p className="text-xs text-gray-500">{campaign.description || 'No description'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{campaign.steps} steps</span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">
                              Created {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{campaign.totalContacts.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{campaign.emailsSent.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{campaign.emailsOpened.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{campaign.emailsReplied.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          campaign.openRate >= 40 ? 'text-green-400' :
                          campaign.openRate >= 25 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {campaign.openRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          campaign.replyRate >= 5 ? 'text-green-400' :
                          campaign.replyRate >= 2 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {campaign.replyRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {campaign.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleCampaignAction(campaign.id, 'pause')}
                              className="p-2 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 rounded-lg transition-all"
                              title="Pause campaign"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          ) : campaign.status === 'PAUSED' ? (
                            <button
                              onClick={() => handleCampaignAction(campaign.id, 'resume')}
                              className="p-2 hover:bg-green-500/10 text-green-400 hover:text-green-300 rounded-lg transition-all"
                              title="Resume campaign"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          ) : campaign.status === 'DRAFT' ? (
                            <button
                              onClick={() => handleCampaignAction(campaign.id, 'launch')}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                              title="Launch campaign"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          ) : null}
                          
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'analytics')}
                            className="p-2 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 rounded-lg transition-all"
                            title="View analytics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'edit')}
                            className="p-2 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                            title="Edit campaign"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'duplicate')}
                            className="p-2 hover:bg-gray-500/10 text-gray-400 hover:text-gray-300 rounded-lg transition-all"
                            title="Duplicate campaign"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          
                          <div className="relative group">
                            <button className="p-2 hover:bg-gray-500/10 text-gray-400 hover:text-gray-300 rounded-lg transition-all">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {/* Dropdown menu would go here */}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Performing Campaign */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Best Performing Campaign</h3>
          {campaigns.length > 0 ? (
            <div>
              {(() => {
                const bestCampaign = campaigns.reduce((best, current) => 
                  current.replyRate > best.replyRate ? current : best
                );
                return (
                  <div>
                    <p className="font-medium text-white">{bestCampaign.name}</p>
                    <p className="text-sm text-gray-400 mb-3">{bestCampaign.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Reply Rate</p>
                        <p className="text-lg font-semibold text-green-400">{bestCampaign.replyRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Open Rate</p>
                        <p className="text-lg font-semibold text-blue-400">{bestCampaign.openRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500">No campaigns yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateWizard(true)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Create New Campaign</p>
                <p className="text-sm text-gray-500">Start a new outreach sequence</p>
              </div>
            </button>
            
            <button
              onClick={() => alert('Campaign templates coming soon!')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <Copy className="h-5 w-5 text-purple-400" />
              <div>
                <p className="font-medium text-white">Use Template</p>
                <p className="text-sm text-gray-500">Start from proven templates</p>
              </div>
            </button>
            
            <button
              onClick={() => alert('Bulk campaign management coming soon!')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Bulk Actions</p>
                <p className="text-sm text-gray-500">Manage multiple campaigns</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Creation Wizard */}
      {showCreateWizard && (
        <CampaignCreationWizard
          onClose={() => setShowCreateWizard(false)}
          onCampaignCreated={handleCampaignCreated}
        />
      )}
    </DashboardLayout>
  );
};

export default Campaigns; 