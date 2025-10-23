
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Logo } from '@/components/logo';

export default function SplashPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If authentication is still loading, do nothing and wait.
    if (isUserLoading) {
      return;
    }

    const timer = setTimeout(() => {
      if (user) {
        router.push('/');
      } else {
        router.push('/login');
      }
    }, 100); // Reduced delay to 100 milliseconds

    // Cleanup the timer if the component unmounts.
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
