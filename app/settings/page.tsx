'use client';

import React, { useState } from 'react';
import { Save, Bell, Mail, Download, Upload, Key, Zap } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import SubscriptionCard from '../../src/components/SubscriptionCard';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailReplies: true,
    meetingBooked: true,
    campaignComplete: false,
    weeklyReport: true,
  });

  const [preferences, setPreferences] = useState({
    defaultSender: 'Callum (CEO)',
    timezone: 'UTC-8 (Pacific)',
    language: 'English',
    autoFollowUp: true,
  });

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handlePreferenceChange = (key: string, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Settings</h1>
        <p className="text-gray-400 text-base font-light">
          Configure your Coldpilot dashboard preferences and integrations
        </p>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Subscription Management */}
        <SubscriptionCard />

        {/* Notification Settings */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Notifications</h3>
              <p className="text-sm text-gray-400">Choose what updates you&apos;d like to receive</p>
            </div>
          </div>

          <div className="space-y-4">
            {globalThis.Object.entries({
              emailReplies: 'Email replies received',
              meetingBooked: 'New meetings booked',
              campaignComplete: 'Campaign completion',
              weeklyReport: 'Weekly performance report',
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-300">{label}</span>
                <button
                  onClick={() => handleNotificationChange(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Preferences */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Mail className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Campaign Preferences</h3>
              <p className="text-sm text-gray-400">Default settings for new campaigns</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Sender Name</label>
              <select 
                value={preferences.defaultSender}
                onChange={(e) => handlePreferenceChange('defaultSender', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Callum (CEO)">Callum (CEO)</option>
                <option value="Callum">Callum</option>
                <option value="Coldpilot Team">Coldpilot Team</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
              <select 
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="UTC-8 (Pacific)">UTC-8 (Pacific)</option>
                <option value="UTC-5 (Eastern)">UTC-5 (Eastern)</option>
                <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                <option value="UTC+1 (CET)">UTC+1 (CET)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300 font-medium">Auto follow-up sequences</span>
                <p className="text-sm text-gray-500">Automatically send follow-up emails</p>
              </div>
              <button
                onClick={() => handlePreferenceChange('autoFollowUp', !preferences.autoFollowUp)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.autoFollowUp ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.autoFollowUp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Download className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Data Management</h3>
              <p className="text-sm text-gray-400">Import and export your campaign data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-gray-700 rounded-lg transition-all">
              <Upload className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <p className="text-white font-medium">Import Contacts</p>
                <p className="text-xs text-gray-400">Upload CSV file</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-gray-700 rounded-lg transition-all">
              <Download className="h-5 w-5 text-green-400" />
              <div className="text-left">
                <p className="text-white font-medium">Export Data</p>
                <p className="text-xs text-gray-400">Download analytics</p>
              </div>
            </button>
          </div>
        </div>

        {/* API & Integrations */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Key className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">API & Integrations</h3>
              <p className="text-sm text-gray-400">Connect external services and manage API access</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">G</span>
                </div>
                <div>
                  <p className="text-white font-medium">Gmail Integration</p>
                  <p className="text-xs text-gray-400">Connected</p>
                </div>
              </div>
              <button className="text-red-400 hover:text-red-300 text-sm">Disconnect</button>
            </div>

            <button className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-gray-600 transition-all">
              <Zap className="h-5 w-5 text-gray-400" />
              <span className="text-gray-400">Connect new integration</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic'; 