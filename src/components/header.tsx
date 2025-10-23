import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <SidebarTrigger />
          <span className="ml-2 font-headline text-2xl font-bold">Smart Energy System</span>
        </div>
      </div>
    </header>
  );
}
