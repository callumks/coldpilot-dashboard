import React from 'react';
import { UserProfile } from '@clerk/nextjs';
import Image from 'next/image';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Coldpilot Logo */}
        <div className="text-center mb-8">
          <div className="relative h-6 mx-auto mb-4 max-w-[200px]">
            <Image
              src="/coldpilot-wm-dark-mode.png"
              alt="Coldpilot"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-medium text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your profile and security settings</p>
        </div>

        {/* Clerk User Profile Component */}
        <div className="flex justify-center">
          <UserProfile 
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
                rootBox: 'w-full flex justify-center',
                card: 'bg-[#111111] border border-gray-800 shadow-2xl rounded-xl w-full max-w-4xl',
                navbar: 'bg-[#0a0a0a] border-r border-gray-800',
                navbarMobileMenuButton: 'text-white',
                navbarMobileMenuRow: 'bg-[#111111] hover:bg-[#1a1a1a]',
                pageScrollBox: 'bg-[#111111]',
                page: 'bg-[#111111]',
                profileSectionTitle: 'text-white',
                profileSectionTitleText: 'text-white',
                profileSectionContent: 'text-gray-300',
                formFieldLabel: 'text-gray-300 font-medium',
                formFieldInput: 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500',
                formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white font-medium',
                formButtonSecondary: 'border-gray-700 text-gray-300 hover:bg-white/5',
                badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                alert: 'bg-gray-800 border-gray-700 text-gray-300',
                alertText: 'text-gray-300',
                modalContent: 'bg-[#111111] border border-gray-800',
                modalCloseButton: 'text-gray-400 hover:text-white',
                fileDropAreaBox: 'border-gray-700 bg-[#1a1a1a]',
                fileDropAreaButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
                avatarImageActionsUpload: 'bg-blue-500 hover:bg-blue-600 text-white',
                avatarImageActionsRemove: 'text-red-400 hover:text-red-300',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 