'use client';

import React from 'react';
import DashboardLayout from '../../src/components/DashboardLayout';

const Contacts: React.FC = () => {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Contacts</h1>
        <p className="text-gray-400 text-base font-light">
          Manage your leads and prospects
        </p>
      </div>
      
      {/* Main Content */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.03] transition-all duration-300 text-center">
        <h3 className="text-xl font-medium text-white mb-4 tracking-tight">Contacts Management</h3>
        <p className="text-gray-400">Contact management features will be implemented here</p>
      </div>
    </DashboardLayout>
  );
};

export default Contacts; 