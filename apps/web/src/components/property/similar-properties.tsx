'use client';

import { useEffect, useState } from 'react';
import { searchApi } from '@/lib/api/search.api';
import { Carousel } from '@/components/ui/carousel';
import { PropertyCard } from '@/components/search/property-card';

interface SimilarPropertiesProps {
  societyId: string;
  currentPropertyId: string;
}

export function SimilarProperties({ societyId, currentPropertyId }: SimilarPropertiesProps) {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await searchApi.searchProperties({ societyId, limit: 6 });
        const all = data.data || [];
        setProperties(all.filter((p: any) => p.id !== currentPropertyId));
      } catch {
        // Show nothing
      }
    }
    fetch();
  }, [societyId, currentPropertyId]);

  if (properties.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-heading-xl text-foreground">Similar Properties in This Society</h2>
      <Carousel showArrows showDots={false} itemClassName="w-[300px] md:w-[340px] pr-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </Carousel>
    </section>
  );
}
