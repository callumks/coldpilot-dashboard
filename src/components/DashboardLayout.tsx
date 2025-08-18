"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md border border-gray-800 text-gray-300 hover:bg-white/5"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5h14a1 1 0 100-2H3a1 1 0 000 2zm14 4H3a1 1 0 000 2h14a1 1 0 100-2zm0 6H3a1 1 0 000 2h14a1 1 0 100-2z" clipRule="evenodd"/></svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative h-5 w-28">
              <Image src="/coldpilot-wm-dark-mode.png" alt="Coldpilot" fill className="object-contain" />
            </div>
          </Link>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <nav className="absolute inset-y-0 left-0 w-72 bg-[#111] border-r border-gray-800 p-4 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="relative h-6 w-32">
                <Image src="/coldpilot-wm-dark-mode.png" alt="Coldpilot" fill className="object-contain object-left" />
              </div>
              <button
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md border border-gray-800 text-gray-300 hover:bg-white/5"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </div>
            <MobileNav onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}

      {/* Main content with responsive left margin */}
      <div className="md:ml-64 ml-0">
        <main className="min-h-screen p-4 md:p-8 relative">
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
    // initialize from persisted flag
    try {
      const flag = typeof window !== 'undefined' ? window.localStorage.getItem('leadSourcingActive') : null;
      if (flag === '1') setActive(true);
    } catch {}

    const onStart = () => {
      setActive(true);
    };
    const onDone = () => {
      setActive(false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'leadSourcingActive') {
        setActive(e.newValue === '1');
      }
    };
    window.addEventListener('lead-sourcing:start', onStart as EventListener);
    window.addEventListener('lead-sourcing:done', onDone as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('lead-sourcing:start', onStart as EventListener);
      window.removeEventListener('lead-sourcing:done', onDone as EventListener);
      window.removeEventListener('storage', onStorage);
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

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/conversations', label: 'Conversations' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/settings', label: 'Settings' },
  ];
  return (
    <ul className="flex flex-col gap-2">
      {items.map(i => (
        <li key={i.href}>
          <Link href={i.href} onClick={onNavigate} className="block px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10">
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}