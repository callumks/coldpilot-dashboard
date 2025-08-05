import React from "react";
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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
} 