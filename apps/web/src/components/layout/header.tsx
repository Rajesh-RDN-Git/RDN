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
  DashboardIcon,
  SettingsIcon,
  LogoutIcon,
} from '@/components/ui/icons';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Gurugram', 'Noida', 'Pune', 'Hyderabad'];

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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

  const navLink =
    'rounded-md px-3 py-2 text-sm font-medium text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground';
  const iconBtn =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground';

  return (
    <header className="sticky top-0 z-header border-b border-chrome-border bg-chrome">
      <div className="mx-auto flex h-header max-w-content items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-chrome-foreground"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground">
              <HomeIcon size={18} />
            </span>
            <span>RDN</span>
          </Link>

          <div ref={cityRef} className="relative hidden md:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground"
            >
              <LocationIcon size={16} />
              <span>{selectedCity || 'All Cities'}</span>
              <ChevronIcon size={14} direction={cityOpen ? 'up' : 'down'} />
            </button>
            {cityOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-md border border-chrome-border bg-chrome py-1 shadow-elevation-3">
                <button
                  onClick={() => {
                    setSelectedCity('');
                    setCityOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors duration-fast hover:bg-chrome-hover ${!selectedCity ? 'text-chrome-foreground' : 'text-chrome-muted'}`}
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
                    className={`flex w-full items-center px-3 py-2 text-sm transition-colors duration-fast hover:bg-chrome-hover ${selectedCity === city ? 'text-chrome-foreground' : 'text-chrome-muted'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href={`/search?transactionType=SALE${selectedCity ? `&city=${selectedCity}` : ''}`}
            className={navLink}
          >
            Buy
          </Link>
          <Link
            href={`/search?transactionType=RENT${selectedCity ? `&city=${selectedCity}` : ''}`}
            className={navLink}
          >
            Rent
          </Link>
          <Link href="/societies" className={navLink}>
            Societies
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" className={`${iconBtn} hidden md:inline-flex`} aria-label="Search">
            <SearchIcon size={18} />
          </Link>
          <Link
            href="/dashboard/properties"
            className={`${iconBtn} hidden md:inline-flex`}
            aria-label="Shortlist"
          >
            <HeartIcon size={18} />
          </Link>

          {isLoading ? null : isAuthenticated && user ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-fast hover:bg-chrome-hover"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                <div className="hidden items-start lg:flex lg:flex-col">
                  <span className="text-sm font-medium leading-tight text-chrome-foreground">
                    {user.name}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wider text-chrome-muted">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
                <ChevronIcon size={14} className="text-chrome-muted" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-dropdown mt-2 w-60 overflow-hidden rounded-md border border-chrome-border bg-chrome py-1 shadow-elevation-3">
                  <div className="border-b border-chrome-border px-3 py-3">
                    <p className="text-sm font-medium text-chrome-foreground">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-chrome-muted">
                      {user.email || user.phone}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    <DashboardIcon size={16} /> Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    <SettingsIcon size={16} /> Settings
                  </Link>
                  <div className="my-1 border-t border-chrome-border" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-error-icon transition-colors duration-fast hover:bg-chrome-hover"
                  >
                    <LogoutIcon size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors duration-fast hover:bg-brand-hover md:inline-flex"
            >
              Login
            </Link>
          )}

          <button
            className={`${iconBtn} md:hidden`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-header z-overlay bg-[var(--color-overlay-backdrop)] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 top-header z-sidebar w-72 overflow-y-auto bg-chrome shadow-elevation-4 md:hidden">
            <div className="flex flex-col p-4">
              <div className="mb-4 rounded-md border border-chrome-border bg-chrome-hover p-3">
                <p className="mb-2 text-overline text-chrome-muted">City</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCity('')}
                    className={`rounded-full px-3 py-1 text-xs ${!selectedCity ? 'bg-brand text-brand-foreground' : 'bg-chrome-border text-chrome-muted'}`}
                  >
                    All
                  </button>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`rounded-full px-3 py-1 text-xs ${selectedCity === city ? 'bg-brand text-brand-foreground' : 'bg-chrome-border text-chrome-muted'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  {
                    label: 'Buy Property',
                    href: `/search?transactionType=SALE${selectedCity ? `&city=${selectedCity}` : ''}`,
                    icon: HomeIcon,
                  },
                  {
                    label: 'Rent Property',
                    href: `/search?transactionType=RENT${selectedCity ? `&city=${selectedCity}` : ''}`,
                    icon: HomeIcon,
                  },
                  { label: 'Societies', href: '/societies', icon: BuildingIcon },
                  { label: 'Search', href: '/search', icon: SearchIcon },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-chrome-muted transition-colors duration-fast hover:bg-chrome-hover hover:text-chrome-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} /> {label}
                  </Link>
                ))}
              </nav>

              <div className="my-4 border-t border-chrome-border" />

              {isLoading ? null : isAuthenticated && user ? (
                <>
                  <div className="mb-3 flex items-center gap-3 px-3">
                    <Avatar src={user.avatarUrl} name={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-chrome-foreground">
                        {user.name}
                      </p>
                      <Badge variant="info" size="sm" className="mt-0.5">
                        {user.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    <DashboardIcon size={18} /> Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    <SettingsIcon size={18} /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="mt-2 flex items-center gap-3 rounded-md px-3 py-3 text-sm text-error-icon hover:bg-chrome-hover"
                  >
                    <LogoutIcon size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
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
