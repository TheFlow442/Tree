
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';

export function Header() {
  const auth = useAuth();
  
  const handleSignOut = () => {
    auth.signOut();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          {/* We can place the logo here if we want it to be part of the main layout */}
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <nav className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
