import type { Metadata } from 'next';
import Link from 'next/link';
import { Manrope } from 'next/font/google';

import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Rankins Inventory Management',
  description: 'Inventory Management System for Berry R&D Test Plot',
  keywords: 'inventory, management, berry, research, agriculture',
  authors: [{ name: 'Rankins Test Plot Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#a855f7',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="min-h-screen bg-background text-foreground">
              <header className="border-b bg-card/50 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                  <Link href="/" className="text-lg font-semibold">
                    Rankins Inventory
                  </Link>
                  <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/inventory" className="hover:text-foreground transition-colors">
                      Inventory
                    </Link>
                    <Link href="/settings/low-stock" className="hover:text-foreground transition-colors">
                      Stock Rules
                    </Link>
                  </nav>
                </div>
              </header>
              <div className="mx-auto w-full max-w-5xl">
                {children}
              </div>
            </div>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
