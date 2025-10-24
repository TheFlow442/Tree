
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes"
import { useUser } from '@/firebase';
import { generateApiKey, getApiKey } from '@/app/actions';
import { Header } from '@/components/header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LineChart, History, Settings, Wifi, Save, Loader2, Moon, Sun, KeyRound, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, isUserLoading: isUserLoadingAuth } = useUser();
  const router = useRouter();
  const { setTheme } = useTheme()
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoadingAuth && !user) {
      router.push('/login');
    }
  }, [user, isUserLoadingAuth, router]);
  
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getApiKey(user.uid).then(result => {
        if(result.success) {
          setApiKey(result.data.apiKey);
        } else {
           toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your API key.",
          });
        }
        setIsLoading(false);
      });
    }
  }, [user, toast]);

  const handleGenerateKey = async () => {
    if (!user) return;
    setIsGenerating(true);
    const result = await generateApiKey(user.uid);
    if (result.success && result.data?.apiKey) {
      setApiKey(result.data.apiKey);
      toast({
        title: "API Key Generated",
        description: "Your new API key is ready to be used.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: result.error,
      });
    }
    setIsGenerating(false);
  };
  
  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setHasCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setHasCopied(false), 2000);
    }
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
              <Link href="/home">
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
        <main className="flex-1 p-4 sm:p-6 md:p-8 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Switch between light and dark mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setTheme("light")}>
                  <Sun className="mr-2" /> Light
                </Button>
                 <Button variant="outline" onClick={() => setTheme("dark")}>
                  <Moon className="mr-2" /> Dark
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ESP32 Integration</CardTitle>
              <CardDescription>
                Connect your ESP32 to collect and store real-time sensor data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="api-key">Your API Key</Label>
                 {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : apiKey ? (
                   <div className="flex items-center space-x-2">
                    <Input
                      id="api-key"
                      type="text"
                      value={apiKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-2">
                    You don't have an API key yet. Generate one below.
                  </p>
                )}
                 <p className="text-sm text-muted-foreground">
                  Use this key in your ESP32's firmware to securely send data to your account.
                </p>
              </div>

               <div className="flex items-center space-x-2">
                <Wifi className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your ESP32 should send POST requests to `/api/data` with the API key in the header.
                </p>
              </div>

              <Button onClick={handleGenerateKey} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <KeyRound className="mr-2" />
                )}
                {isGenerating ? 'Generating...' : (apiKey ? 'Generate New Key' : 'Generate API Key')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
