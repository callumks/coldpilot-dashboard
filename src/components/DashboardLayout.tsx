import React, { useEffect, useState } from 'react';
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
        <main className="min-h-screen p-8 relative">
          {/* Global lead sourcing indicator */}
          <LeadSourcingIndicator />
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 

function LeadSourcingIndicator() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onStart = () => setActive(true);
    const onDone = () => setActive(false);
    window.addEventListener('lead-sourcing:start', onStart as EventListener);
    window.addEventListener('lead-sourcing:done', onDone as EventListener);
    return () => {
      window.removeEventListener('lead-sourcing:start', onStart as EventListener);
      window.removeEventListener('lead-sourcing:done', onDone as EventListener);
    };
  }, []);
  if (!active) return null;
  return (
    <div className="fixed top-6 right-8 z-40">
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
        <span className="text-sm text-blue-300">Sourcing leads...</span>
      </div>
    </div>
  );
}