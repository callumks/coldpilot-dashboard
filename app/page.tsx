'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.push('/dashboard');
      } else {
        router.push('/sign-in');
      }
    }
  }, [isSignedIn, isLoaded, router]);

  // Loading state while Clerk checks authentication
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="relative h-8 mx-auto mb-6 max-w-[200px]">
          <Image
            src="/coldpilot-wm-dark-mode.png"
            alt="Coldpilot"
            fill
            className="object-contain"
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Prevent static generation for this page since it uses client-side auth
export const dynamic = 'force-dynamic'; 