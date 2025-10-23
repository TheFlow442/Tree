import { SidebarTrigger } from '@/components/ui/sidebar';
import { Sun } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <Sun className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Smart Energy System
            </span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <nav className="flex items-center">
            {/* You can add more header items here if needed */}
          </nav>
        </div>
      </div>
    </header>
  );
}
