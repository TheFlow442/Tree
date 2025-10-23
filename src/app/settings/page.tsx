
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Header } from '@/components/header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LineChart, History, Settings, Wifi, Save, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, isUserLoading: isUserLoadingAuth } = useUser();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoadingAuth && !user) {
      router.push('/login');
    }
  }, [user, isUserLoadingAuth, router]);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call to save settings
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your ESP32 settings have been updated.",
      });
    }, 1500);
  };
  
  if (isUserLoadingAuth || !user) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <LineChart />
                Prediction
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/history">
                <History />
                History
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
               <Link href="/settings">
                <Settings />
                Setting
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>ESP32 Integration</CardTitle>
              <CardDescription>
                Connect your ESP32 to collect and store real-time sensor data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your device API key"
                />
                <p className="text-sm text-muted-foreground">
                  This key will be used by your ESP32 to securely send data.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your ESP32 should send POST requests to `/api/data` with the API key in the header.
                </p>
              </div>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
