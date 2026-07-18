'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const router = useRouter();
  const { hasProfile, isLoaded } = useProfile();

  useEffect(() => {
    if (isLoaded && hasProfile) {
      router.replace('/dashboard');
    }
  }, [isLoaded, hasProfile, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (hasProfile) return null;

  return <LandingPage />;
}
