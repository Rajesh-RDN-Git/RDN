import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { BuildingIcon, LocationIcon, ChevronIcon } from '@/components/ui/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Gurugram', 'Noida', 'Pune', 'Hyderabad'];
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: 'Browse Societies | RDN',
  description:
    'Browse verified residential societies across India. Find apartments for rent and sale in your community.',
};

interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  totalUnits: number;
  verificationStatus: string;
  media?: Array<{ url: string }>;
}

async function getSocieties(city?: string, page = 1) {
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      ...(page > 1 && { page: String(page) }),
      ...(city && { city }),
    });
    const res = await fetch(`${API_URL}/societies?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    const payload = json.data ?? json;
    return { data: payload.data || [], total: payload.total || 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export default async function SocietiesPage({
  searchParams,
}: {
  searchParams: { city?: string; page?: string };
}) {
  const city = searchParams.city || '';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { data: societies, total } = await getSocieties(city, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-heading-xl text-gray-900">Browse Societies</h1>
        <p className="mt-1 text-body-md text-gray-500">
          Discover verified residential communities across India
        </p>
      </div>

      {/* City filter chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/societies"
          className={`rounded-full px-4 py-2 text-body-sm font-medium transition-colors ${
            !city ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Cities
        </Link>
        {CITIES.map((c) => (
          <Link
            key={c}
            href={`/societies?city=${c}`}
            className={`rounded-full px-4 py-2 text-body-sm font-medium transition-colors ${
              city === c
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="mb-4 text-body-sm text-gray-500">
          {total} {total === 1 ? 'society' : 'societies'} found
          {city ? ` in ${city}` : ''}
        </p>
      )}

      {/* Grid */}
      {societies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
          <BuildingIcon size={48} className="mb-4 text-gray-300" />
          <h3 className="text-heading-md text-gray-900">No societies found</h3>
          <p className="mt-2 max-w-sm text-body-md text-gray-500">
            {city
              ? `No societies are currently listed in ${city}. Try another city.`
              : 'No societies are currently listed. Check back soon.'}
          </p>
          {city && (
            <Link
              href="/societies"
              className="mt-4 text-label-md text-primary-600 hover:text-primary-700"
            >
              View all cities
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(societies as Society[]).map((society) => (
            <SocietyCard key={society.id} society={society} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1">
          {page > 1 && (
            <Link
              href={`/societies?${new URLSearchParams({ ...(city && { city }), page: String(page - 1) })}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ChevronIcon size={16} direction="left" className="inline" /> Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
            .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e-${i}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <Link
                  key={p}
                  href={`/societies?${new URLSearchParams({ ...(city && { city }), ...(p > 1 && { page: String(p) }) })}`}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    page === p ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </Link>
              ),
            )}
          {page < totalPages && (
            <Link
              href={`/societies?${new URLSearchParams({ ...(city && { city }), page: String(page + 1) })}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Next <ChevronIcon size={16} direction="right" className="inline" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function SocietyCard({ society }: { society: Society }) {
  return (
    <Link
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
  );
}
