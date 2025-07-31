'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../src/components/DashboardLayout';
import { 
  UserIcon, 
  BellIcon, 
  UserCircleIcon, 
  ShieldCheckIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    organizationName: 'Coldpilot',
    timeZone: 'UTC-8',
    autoFollowUps: true,
    trackEmailOpens: true,
    sendReadReceipts: true,
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Settings Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
          <h2 className="text-lg font-medium text-white mb-4">Settings</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Settings Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-white mb-1">Settings</h1>
              <p className="text-gray-400 text-sm">
                Manage your account and application preferences
              </p>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={settings.organizationName}
                        onChange={(e) => handleSettingChange('organizationName', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time Zone
                      </label>
                      <select
                        value={settings.timeZone}
                        onChange={(e) => handleSettingChange('timeZone', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="UTC-8">UTC-8 (Pacific Time)</option>
                        <option value="UTC-5">UTC-5 (Eastern Time)</option>
                        <option value="UTC-6">UTC-6 (Central Time)</option>
                        <option value="UTC-7">UTC-7 (Mountain Time)</option>
                        <option value="UTC+0">UTC+0 (Greenwich Mean Time)</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Default Campaign Settings</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoFollowUps}
                            onChange={(e) => handleSettingChange('autoFollowUps', e.target.checked)}
                            className="mr-3 h-4 w-4 text-primary-500 bg-gray-800 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-gray-300 text-sm">Auto-send follow-ups</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.trackEmailOpens}
                            onChange={(e) => handleSettingChange('trackEmailOpens', e.target.checked)}
                            className="mr-3 h-4 w-4 text-primary-500 bg-gray-800 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-gray-300 text-sm">Track email opens</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.sendReadReceipts}
                            onChange={(e) => handleSettingChange('sendReadReceipts', e.target.checked)}
                            className="mr-3 h-4 w-4 text-primary-500 bg-gray-800 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-gray-300 text-sm">Send read receipts</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-6 py-3 bg-primary-500 text-white text-sm font-semibold rounded-md hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-lg">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                <p className="text-gray-400">Configure your notification settings here.</p>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Profile Settings</h3>
                <p className="text-gray-400">Manage your profile information and preferences.</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Security Settings</h3>
                <p className="text-gray-400">Configure security and privacy settings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings; 