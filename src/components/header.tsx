import { Sun } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Sun className="h-6 w-6 text-primary" />
          <span className="ml-2 font-headline text-lg font-bold">Solaris智控</span>
        </div>
      </div>
    </header>
  );
}
