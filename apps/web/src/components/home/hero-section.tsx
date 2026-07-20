'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { RangeSlider } from '@/components/ui/range-slider';

const CYCLING_WORDS = ['Buy', 'Rent', 'Invest'];

export function HeroSection() {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [activeTab, setActiveTab] = useState<'SALE' | 'RENT'>('SALE');
  const [q, setQ] = useState('');
  const [bhk, setBhk] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budget, setBudget] = useState<[number, number]>([0, 50000000]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('transactionType', activeTab);
    if (q.trim()) params.set('q', q.trim());
    if (bhk) params.set('bhk', bhk);
    if (propertyType) params.set('propertyType', propertyType);
    if (budget[0] > 0) params.set('priceMin', String(budget[0]));
    if (budget[1] < 50000000) params.set('priceMax', String(budget[1]));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[60vh] overflow-hidden bg-gradient-to-br from-chrome via-chrome to-chrome md:min-h-[50vh]">
      {/* Decorative blur orbs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-brand blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-brand blur-[100px]" />
      </div>

      <div className="relative mx-auto flex max-w-content flex-col items-center px-4 pb-12 pt-16 md:pb-16 md:pt-24">
        <h1 className="mb-4 text-center text-display-md text-chrome-foreground md:text-display-lg">
          Find Your Dream Home to{' '}
          <span
            className={`inline-block text-brand transition-all duration-300 ${fade ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
          >
            {CYCLING_WORDS[wordIndex]}
          </span>
        </h1>
        <p className="mb-10 max-w-2xl text-center text-body-lg text-chrome-muted">
          India&apos;s first community-driven real estate platform. Browse verified properties from
          trusted society dealers — no external brokers.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-4xl rounded-2xl bg-card p-4 shadow-elevation-3 md:p-6">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-subtle p-1">
            {(['SALE', 'RENT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-4 py-2 text-label-md font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'SALE' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>

          {/* Free-text search: locality / sector / society / builder */}
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-ring">
            <SearchIcon size={20} className="shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by locality, sector, society or builder (e.g. Golf Course Road, Sector 42, DLF)"
              className="w-full bg-transparent text-body-md text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="rounded-lg border border-border bg-muted px-3 py-2.5 text-body-md text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Property Type</option>
              <option value="APARTMENT">Apartment</option>
              <option value="VILLA">Villa</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>

            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="rounded-lg border border-border bg-muted px-3 py-2.5 text-body-md text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5+ BHK</option>
            </select>

            <div className="md:col-span-1">
              <RangeSlider
                min={0}
                max={50000000}
                step={500000}
                value={budget}
                onChange={setBudget}
              />
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              leftIcon={<SearchIcon size={20} />}
              className="w-full"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
