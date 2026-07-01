"use client";

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#EC4899]" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
