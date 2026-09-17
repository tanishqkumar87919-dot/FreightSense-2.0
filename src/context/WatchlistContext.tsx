'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WatchlistItem {
  id: string;
  name: string;
  type: 'Routes' | 'Ports' | 'Vessels' | 'Markets' | 'Forecasts' | 'Reports';
  status: string;
  latestChange: string;
  forecast: string;
  risk: 'Low' | 'Moderate' | 'High' | 'Severe';
  lastUpdated: string;
  targetPath: string;
}

const initialWatchlist: WatchlistItem[] = [
  {
    id: 'w-1',
    name: 'Shanghai to Rotterdam',
    type: 'Routes',
    status: 'Operational (Cape Bypass)',
    latestChange: '-1.99% ($4,180/FEU)',
    forecast: 'Bearish (-6.9% in 30d)',
    risk: 'High',
    lastUpdated: '10 min ago',
    targetPath: '/routes',
  },
  {
    id: 'w-2',
    name: 'Port of Singapore (Tuas)',
    type: 'Ports',
    status: 'High Congestion (56 waiting)',
    latestChange: '+0.7d dwell (4.6d avg)',
    forecast: 'Peak Yard Pressure',
    risk: 'High',
    lastUpdated: '25 min ago',
    targetPath: '/ports',
  },
  {
    id: 'w-3',
    name: 'MSC Irina (IMO 9929429)',
    type: 'Vessels',
    status: 'At Sea (17.8 kts)',
    latestChange: 'On Schedule (Cape Agulhas)',
    forecast: 'ETA Sep 29 Rotterdam',
    risk: 'Low',
    lastUpdated: '1 hr ago',
    targetPath: '/vessels',
  },
  {
    id: 'w-4',
    name: 'FBX-GL Global Index',
    type: 'Markets',
    status: '$3,240 / FEU',
    latestChange: '+4.68% week-on-week',
    forecast: 'Plateau Stage',
    risk: 'Moderate',
    lastUpdated: '4 hrs ago',
    targetPath: '/market',
  },
];

interface WatchlistContextType {
  items: WatchlistItem[];
  addItem: (item: WatchlistItem) => void;
  removeItem: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WatchlistItem[]>(initialWatchlist);

  const addItem = (item: WatchlistItem) => {
    if (!items.some(i => i.id === item.id)) {
      setItems(prev => [item, ...prev]);
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const isSaved = (id: string) => items.some(i => i.id === id);

  return (
    <WatchlistContext.Provider value={{ items, addItem, removeItem, isSaved }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
