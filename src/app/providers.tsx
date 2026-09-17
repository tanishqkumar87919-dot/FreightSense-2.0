'use client';

import React, { useState } from 'react';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CommandPalette } from '@/components/layout/CommandPalette';

export function Providers({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <PreferencesProvider>
      <NotificationProvider>
        <WatchlistProvider>
          <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        </WatchlistProvider>
      </NotificationProvider>
    </PreferencesProvider>
  );
}
