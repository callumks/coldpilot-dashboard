import React from "react";
import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "Coldpilot Dashboard",
  description: "Manage your cold outreach campaigns with AI-powered automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#3b82f6', // Blue primary color to match your dashboard
          colorBackground: '#0a0a0a', // Dark background
          colorInputBackground: '#1a1a1a',
          colorInputText: '#ffffff',
        },
        elements: {
          formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-sm font-medium',
          card: 'bg-[#111] border border-gray-800',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-white/5 border border-gray-700 hover:bg-white/10',
          formFieldLabel: 'text-gray-300',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
        }
      }}
    >
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
} 