"use client";
import React, { useEffect, useState } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "Coldpilot Dashboard",
  description: "Manage your cold outreach campaigns with AI-powered automation",
  icons: {
    icon: '/coldpilot-favicon.png',
    shortcut: '/coldpilot-favicon.png',
    apple: '/coldpilot-favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: '#111111',
              colorInputBackground: '#1a1a1a',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              colorShimmer: '#374151',
              colorSuccess: '#10b981',
              colorWarning: '#f59e0b',
              colorDanger: '#ef4444',
              borderRadius: '0.75rem',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            elements: {
              card: 'bg-[#111111] border border-gray-800 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-white/5 border border-gray-700 hover:bg-white/10',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500',
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white font-medium',
              footerActionLink: 'text-blue-400 hover:text-blue-300',
              userButtonPopover: 'bg-[#111111] border border-gray-800',
              userButtonPopoverCard: 'bg-[#111111]',
              userButtonPopoverActions: 'bg-[#111111]',
              userButtonPopoverActionButton: 'text-gray-300 hover:text-white hover:bg-white/5',
              userButtonPopoverActionButtonText: 'text-gray-300',
            }
          }}
        >
          <GlobalLeadSourcingIndicator />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
} 

function GlobalLeadSourcingIndicator() {
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
}