'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Ship,
  Search,
  Bell,
  HelpCircle,
  Bookmark,
  User,
  Menu,
  X,
  Compass,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { usePreferences } from '@/context/PreferencesContext';

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { preferences } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Don't show regular floating nav on onboarding or auth pages if desired, but prompt says:
  // "Global navigation: Overview, Intelligence, Forecast, Market, Routes, Ports, Vessels, Alerts, Reports"
  // Let's keep it visible everywhere or adapt seamlessly.
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/onboarding';

  const navLinks = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Map', href: '/map' },
    { name: 'Market', href: '/market' },
    { name: 'Forecast', href: '/forecast' },
    { name: 'Routes', href: '/routes' },
    { name: 'Ports', href: '/ports' },
    { name: 'Vessels', href: '/vessels' },
    { name: 'Trade Flows', href: '/trade-flows' },
    { name: 'Weather', href: '/weather' },
    { name: 'Signals', href: '/signals' },
    { name: 'AI Insights', href: '/insights' },
    { name: 'Alerts', href: '/alerts' },
    { name: 'Reports', href: '/reports' },
    { name: 'Cargo Analysis', href: '/cargo-analysis' },
    { name: 'Scenario', href: '/scenario' },
    { name: 'Explorer', href: '/explorer' },
    { name: 'Compare', href: '/compare' },
  ];

  // Primary top links shown directly on desktop navbar
  const primaryLinks = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Map', href: '/map' },
    { name: 'Market', href: '/market' },
    { name: 'Forecast', href: '/forecast' },
    { name: 'Routes', href: '/routes' },
    { name: 'Ports', href: '/ports' },
    { name: 'Vessels', href: '/vessels' },
    { name: 'Signals', href: '/signals' },
    { name: 'AI Insights', href: '/insights' },
    { name: 'Alerts', href: '/alerts' },
    { name: 'Reports', href: '/reports' },
  ];

  // More menu for the rest
  const moreLinks = [
    { name: 'Bulk Cargo Analysis (SIH)', href: '/cargo-analysis' },
    { name: 'Trade Flows', href: '/trade-flows' },
    { name: 'Weather & Ocean', href: '/weather' },
    { name: 'Scenario Analysis', href: '/scenario' },
    { name: 'Data Explorer', href: '/explorer' },
    { name: 'Compare Intelligence', href: '/compare' },
    { name: 'Data Methodology', href: '/methodology' },
    { name: 'Integrations & API', href: '/integrations' },
  ];

  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 transition-all">
      <div className="max-w-7xl mx-auto glass-nav rounded-2xl px-4 lg:px-6 h-16 flex items-center justify-between shadow-sm">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-900 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-sky-200 animate-spin-slow" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
                Freight<span className="text-sky-600">Sense</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded">
                2.0
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {primaryLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                    isActive
                      ? 'text-sky-700 bg-sky-50/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-600 rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 flex items-center gap-1 transition-all"
              >
                More <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  {moreLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreDropdownOpen(false)}
                      className={`block px-4 py-2 text-xs font-medium ${
                        pathname === item.href
                          ? 'text-sky-700 bg-sky-50'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2">
          {/* Global Search Trigger (Cmd + K) */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-xs transition-colors"
            title="Search Intelligence (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Watchlist Quick Link */}
          <Link
            href="/watchlist"
            className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors relative ${
              pathname === '/watchlist' ? 'text-sky-700 bg-sky-50' : ''
            }`}
            title="Saved Watchlist"
          >
            <Bookmark className="w-4 h-4" />
          </Link>

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors relative ${
              pathname === '/notifications' ? 'text-sky-700 bg-sky-50' : ''
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Help / Docs */}
          <Link
            href="/docs"
            className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors ${
              pathname === '/docs' ? 'text-sky-700 bg-sky-50' : ''
            }`}
            title="Documentation & Knowledge Base"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-sky-200 text-xs font-semibold flex items-center justify-center">
                MV
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{preferences.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{preferences.role}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{preferences.company}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    Workspace Settings
                  </Link>
                  <Link
                    href="/watchlist"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    My Watchlist
                  </Link>
                  <Link
                    href="/methodology"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Methodology & Sources
                  </Link>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <User className="w-4 h-4" />
                    Switch Account / Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-2 glass-card rounded-2xl p-4 border border-slate-200/90 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-lg font-medium ${
                  pathname === item.href ? 'bg-sky-100 text-sky-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between text-xs text-slate-500">
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
              Help & Docs
            </Link>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
              Settings
            </Link>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-rose-600 font-medium">
              Sign Out
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
