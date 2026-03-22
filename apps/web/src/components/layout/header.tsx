'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  SearchIcon,
  HeartIcon,
  ChevronIcon,
  CloseIcon,
  MenuIcon,
  LocationIcon,
  BuildingIcon,
  HomeIcon,
} from '@/components/ui/icons';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Gurugram', 'Noida', 'Pune', 'Hyderabad'];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-header border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-header max-w-content items-center justify-between px-4">
        {/* Left section: Logo + City */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <HomeIcon size={18} className="text-white" />
            </div>
            <span>RDN</span>
          </Link>

          {/* City Selector - desktop */}
          <div ref={cityRef} className="relative hidden md:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-md text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <LocationIcon size={16} />
              <span>{selectedCity || 'All Cities'}</span>
              <ChevronIcon size={14} direction={cityOpen ? 'up' : 'down'} />
            </button>
            {cityOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-elevation-3">
                <button
                  onClick={() => {
                    setSelectedCity('');
                    setCityOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-gray-700 ${!selectedCity ? 'text-primary-400' : 'text-gray-300'}`}
                >
                  All Cities
                </button>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-gray-700 ${selectedCity === city ? 'text-primary-400' : 'text-gray-300'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Nav links - desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href={`/search?transactionType=SALE${selectedCity ? `&city=${selectedCity}` : ''}`}
            className="rounded-lg px-4 py-2 text-body-md font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Buy
          </Link>
          <Link
            href={`/search?transactionType=RENT${selectedCity ? `&city=${selectedCity}` : ''}`}
            className="rounded-lg px-4 py-2 text-body-md font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Rent
          </Link>
          <Link
            href="/societies"
            className="rounded-lg px-4 py-2 text-body-md font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Societies
          </Link>
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:flex"
            aria-label="Search"
          >
            <SearchIcon size={20} />
          </Link>

          <Link
            href="/dashboard/properties"
            className="relative hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:flex"
            aria-label="Shortlist"
          >
            <HeartIcon size={20} />
          </Link>

          {/* User menu - desktop */}
          {isAuthenticated && user ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-800"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                <div className="hidden items-start lg:flex lg:flex-col">
                  <span className="text-sm font-medium text-white">{user.name}</span>
                  <Badge variant="info" className="mt-0.5 text-[10px]">
                    {user.role?.replace('_', ' ')}
                  </Badge>
                </div>
                <ChevronIcon size={14} className="text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-elevation-3">
                  <div className="border-b border-gray-700 px-4 py-3">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email || user.phone}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BuildingIcon size={16} />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                  <div className="my-1 border-t border-gray-700" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-gray-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 md:block"
            >
              Login
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-in overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-header z-overlay bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 top-header z-sidebar w-72 bg-gray-900 shadow-elevation-4 md:hidden">
            <div className="flex flex-col overflow-y-auto p-4">
              {/* City selector mobile */}
              <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  City
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCity('')}
                    className={`rounded-full px-3 py-1 text-xs ${!selectedCity ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    All
                  </button>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`rounded-full px-3 py-1 text-xs ${selectedCity === city ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nav links */}
              <nav className="space-y-1">
                <Link
                  href={`/search?transactionType=SALE${selectedCity ? `&city=${selectedCity}` : ''}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <HomeIcon size={20} /> Buy Property
                </Link>
                <Link
                  href={`/search?transactionType=RENT${selectedCity ? `&city=${selectedCity}` : ''}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <HomeIcon size={20} /> Rent Property
                </Link>
                <Link
                  href="/societies"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <BuildingIcon size={20} /> Societies
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <SearchIcon size={20} /> Search
                </Link>
              </nav>

              <div className="my-4 border-t border-gray-700" />

              {isAuthenticated && user ? (
                <>
                  <div className="mb-3 flex items-center gap-3 px-3">
                    <Avatar src={user.avatarUrl} name={user.name} size="md" />
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <Badge variant="info" className="mt-0.5 text-[10px]">
                        {user.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-red-400 hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white hover:bg-primary-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
