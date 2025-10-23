
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Logo } from '@/components/logo';

export default function SplashPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isUserLoading) {
        if (user) {
          router.push('/');
        } else {
          router.push('/login');
        }
      }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="animate-pulse">
        <Logo />
      </div>
      <p className="mt-4 text-lg italic text-muted-foreground animate-fadeIn">
        "The sun is a daily reminder that we too can rise again from the darkness."
      </p>
    </div>
  );
}
