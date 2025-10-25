import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solaris智控',
  description: 'Intelligent Solar System Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="font-body antialiased min-h-screen bg-background"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  )
}
