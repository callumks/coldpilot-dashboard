import React from 'react';
import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Coldpilot Logo */}
        <div className="text-center mb-8">
          <div className="relative h-8 mx-auto mb-4 max-w-[200px]">
            <Image
              src="/coldpilot-wm-dark-mode.png"
              alt="Coldpilot"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-medium text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your Coldpilot dashboard</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn 
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
                card: 'bg-[#111111] border border-gray-800 shadow-2xl rounded-xl p-8 w-full max-w-md',
                headerTitle: 'text-white text-xl font-semibold text-center mb-2',
                headerSubtitle: 'text-gray-400 text-center mb-6',
                socialButtons: 'flex flex-col gap-3 mb-6',
                socialButtonsBlockButton: 'bg-white/5 hover:bg-white/10 border border-gray-700 text-white rounded-lg py-3 px-4 transition-all',
                socialButtonsBlockButtonText: 'text-white font-medium',
                dividerLine: 'bg-gray-700',
                dividerText: 'text-gray-400 text-sm',
                formFieldLabel: 'text-gray-300 font-medium mb-2 block',
                formFieldInput: 'w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all',
                formButtonPrimary: 'w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all',
                formFieldErrorText: 'text-red-400 text-sm mt-1',
                identityPreviewText: 'text-gray-300',
                identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
                formResendCodeLink: 'text-blue-400 hover:text-blue-300',
                footerActionText: 'text-gray-400',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-medium',
                formFieldSuccessText: 'text-green-400',
                alertText: 'text-gray-300',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 