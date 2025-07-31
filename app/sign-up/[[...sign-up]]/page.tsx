import React from 'react';
import { SignUp } from '@clerk/nextjs';
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
          <h1 className="text-2xl font-medium text-white mb-2">Get started</h1>
          <p className="text-gray-400">Create your Coldpilot account</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp 
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