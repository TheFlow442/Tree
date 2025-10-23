
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/home');
    }, 1000); // A 1-second delay for the splash screen effect.

    // Cleanup the timer if the component unmounts.
    return () => clearTimeout(timer);
  }, [router]);

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
