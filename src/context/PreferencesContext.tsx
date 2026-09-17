'use client';

import React, { createContext, useContext, useState } from 'react';

export interface UserPreferences {
  name: string;
  email: string;
  company: string;
  role: string;
  workspaceName: string;
  defaultRegion: string;
  timezone: string;
  defaultDashboard: string;
  defaultDateRange: string;
  currency: string;
  speedUnit: string;
  distanceUnit: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketAlerts: boolean;
  routeAlerts: boolean;
  portAlerts: boolean;
}

const defaultPreferences: UserPreferences = {
  name: 'Marcus Vance',
  email: 'm.vance@vanguardlogistics.com',
  company: 'Vanguard Global Freight Group',
  role: 'VP of Global Maritime Procurement',
  workspaceName: 'Vanguard Maritime Command',
  defaultRegion: 'Global Mainlanes',
  timezone: 'UTC (Greenwich Mean Time)',
  defaultDashboard: 'Executive Overview',
  defaultDateRange: '30D',
  currency: 'USD ($)',
  speedUnit: 'Knots (kts)',
  distanceUnit: 'Nautical Miles (nm)',
  emailNotifications: true,
  pushNotifications: true,
  marketAlerts: true,
  routeAlerts: true,
  portAlerts: true,
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
