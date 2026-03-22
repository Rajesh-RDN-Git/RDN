'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { societiesApi } from '@/lib/api/societies.api';
import { Carousel } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { BuildingIcon, LocationIcon, ArrowRightIcon } from '@/components/ui/icons';

interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  totalUnits: number;
  verificationStatus: string;
  media?: Array<{ url: string }>;
}

export function FeaturedSocieties() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [error, setError] = useState(false);

  const fetchSocieties = async () => {
    setError(false);
    try {
      const { data } = await societiesApi.list({ limit: 8 });
      setSocieties(data.data || []);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  if (!error && societies.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-content px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-heading-xl text-gray-900">Featured Societies</h2>
            <p className="mt-1 text-body-md text-gray-500">
              Browse verified residential communities
            </p>
          </div>
          <Link
            href="/societies"
            className="hidden items-center gap-1 text-label-md text-primary-600 hover:text-primary-700 md:flex"
          >
            View All <ArrowRightIcon size={16} />
          </Link>
        </div>

        {error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-body-md text-gray-500">Failed to load societies.</p>
            <button
              onClick={fetchSocieties}
              className="mt-2 text-label-md text-primary-600 hover:text-primary-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <Carousel
            autoplay
            autoplayInterval={5000}
            showDots
            showArrows
            itemClassName="w-[280px] md:w-[320px] pr-4"
          >
            {societies.map((society) => (
              <Link
                key={society.id}
                href={`/society/${society.slug}`}
                className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-elevation-2"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  {society.media?.[0]?.url ? (
                    <img
                      src={society.media[0].url}
                      alt={society.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                      <BuildingIcon size={48} className="text-primary-300" />
                    </div>
                  )}
                  {society.verificationStatus === 'VERIFIED' && (
                    <Badge variant="success" className="absolute right-3 top-3">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-heading-sm text-gray-900 group-hover:text-primary-600">
                    {society.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-body-sm text-gray-500">
                    <LocationIcon size={14} /> {society.city}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-caption-md text-gray-400">
                    <BuildingIcon size={14} />
                    {society.totalUnits || '—'} units
                  </div>
                </div>
              </Link>
            ))}
          </Carousel>
        )}

        <Link
          href="/societies"
          className="mt-6 flex items-center justify-center gap-1 text-label-md text-primary-600 hover:text-primary-700 md:hidden"
        >
          View All Societies <ArrowRightIcon size={16} />
        </Link>
      </div>
    </section>
  );
}
