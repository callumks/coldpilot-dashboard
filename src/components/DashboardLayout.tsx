import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main content with left margin to account for fixed sidebar */}
      <div className="ml-64">
        <main className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 