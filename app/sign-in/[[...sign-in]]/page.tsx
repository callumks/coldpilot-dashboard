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
              elements: {
                rootBox: "w-full",
                card: "bg-[#111] border border-gray-800 shadow-2xl",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 