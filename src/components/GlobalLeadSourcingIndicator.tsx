"use client";
import React, { useEffect, useState } from 'react';

const GlobalLeadSourcingIndicator: React.FC = () => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem('leadSourcingActive') === '1') setActive(true); } catch {}
    const onStart = () => { setActive(true); try { localStorage.setItem('leadSourcingActive', '1'); } catch {} };
    const onDone = () => { setActive(false); try { localStorage.setItem('leadSourcingActive', '0'); } catch {} };
    const onStorage = (e: StorageEvent) => { if (e.key === 'leadSourcingActive') setActive(e.newValue === '1'); };
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
    <div className="fixed top-6 right-8 z-[1000]">
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.12] backdrop-blur">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
        <span className="text-sm text-blue-200">Sourcing leads...</span>
      </div>
    </div>
  );
};

export default GlobalLeadSourcingIndicator;

