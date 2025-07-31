'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const Contacts: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-white mb-1">Contacts</h1>
            <p className="text-gray-400 text-sm">
              Manage your leads and prospects
            </p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-card text-center">
            <h3 className="text-lg font-medium text-white mb-2">Contacts Page</h3>
            <p className="text-gray-400">Contact management features will be implemented here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Contacts; 