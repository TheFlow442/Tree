
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { toast } = useToast();
  
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const { auth } = firebaseServices;
    if (auth.currentUser) return; // Already signed in

    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Could not connect to the service. Please refresh the page.'
      })
    });
  }, [firebaseServices, toast]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      database={firebaseServices.database}
      auth={firebaseServices.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
