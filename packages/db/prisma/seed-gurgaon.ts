/**
 * One-time seed: real residential societies in Gurugram (Gurgaon), Haryana.
 *
 * Idempotent — every society is an upsert keyed on `slug`, so re-running is safe
 * and will not create duplicates. Societies are inserted as VERIFIED + ONBOARDED
 * so they are publicly visible immediately. No RWA admin is assigned (optional);
 * assign later via the SUPER_ADMIN dashboard.
 *
 * Run against UAT:
 *   DATABASE_URL="<uat-postgres-url>" pnpm --filter @rdn/db db:seed:gurgaon
 *
 * Data note: sector/pincode/coordinates are real-world approximations for well-known
 * Gurgaon societies. Verify exact addresses in the dashboard before going prod.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SocietySeed = {
  name: string;
  slug: string;
  address: string;
  pincode: string;
  lat: number;
  lng: number;
  totalUnits: number;
  amenities: string[];
};

const GURGAON_SOCIETIES: SocietySeed[] = [
  {
    name: 'DLF The Aralias',
    slug: 'dlf-the-aralias-gurgaon',
    address: 'Golf Course Road, Sector 42, DLF Phase 5',
    pincode: '122002',
    lat: 28.4522,
    lng: 77.099,
    totalUnits: 252,
    amenities: [
      'Swimming Pool',
      'Gym',
      'Club House',
      'Golf Course View',
      'Power Backup',
      'Security',
      'Tennis Court',
    ],
  },
  {
    name: 'DLF The Magnolias',
    slug: 'dlf-the-magnolias-gurgaon',
    address: 'Golf Course Road, Sector 42',
    pincode: '122009',
    lat: 28.4431,
    lng: 77.1031,
    totalUnits: 700,
    amenities: [
      'Swimming Pool',
      'Gym',
      'Club House',
      'Spa',
      'Power Backup',
      'Security',
      'Concierge',
    ],
  },
  {
    name: 'DLF The Crest',
    slug: 'dlf-the-crest-gurgaon',
    address: 'Golf Course Road, Sector 54',
    pincode: '122011',
    lat: 28.4356,
    lng: 77.108,
    totalUnits: 657,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Kids Play Area', 'Power Backup', 'Security'],
  },
  {
    name: 'DLF Park Place',
    slug: 'dlf-park-place-gurgaon',
    address: 'Sector 54, Golf Course Road',
    pincode: '122002',
    lat: 28.4385,
    lng: 77.1062,
    totalUnits: 1232,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Jogging Track', 'Power Backup', 'Security'],
  },
  {
    name: 'DLF Princeton Estate',
    slug: 'dlf-princeton-estate-gurgaon',
    address: 'DLF Phase 5, Sector 53',
    pincode: '122009',
    lat: 28.441,
    lng: 77.1005,
    totalUnits: 480,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Sushant Lok Phase 1',
    slug: 'sushant-lok-phase-1-gurgaon',
    address: 'Sushant Lok Phase 1, Sector 43',
    pincode: '122002',
    lat: 28.466,
    lng: 77.082,
    totalUnits: 1500,
    amenities: ['Park', 'Power Backup', 'Security', 'Market', 'CCTV'],
  },
  {
    name: 'Ardee City',
    slug: 'ardee-city-gurgaon',
    address: 'Sector 52, Gurgaon-Faridabad Road',
    pincode: '122003',
    lat: 28.4445,
    lng: 77.0925,
    totalUnits: 1100,
    amenities: ['Swimming Pool', 'Club House', 'Park', 'Power Backup', 'Security', 'School'],
  },
  {
    name: 'Vatika India Next',
    slug: 'vatika-india-next-gurgaon',
    address: 'Sector 82-83, New Gurgaon',
    pincode: '122012',
    lat: 28.4005,
    lng: 76.9512,
    totalUnits: 2000,
    amenities: [
      'Swimming Pool',
      'Gym',
      'Club House',
      'Park',
      'Power Backup',
      'Security',
      'Shopping Centre',
    ],
  },
  {
    name: 'Emaar Palm Drive',
    slug: 'emaar-palm-drive-gurgaon',
    address: 'Sector 66, Golf Course Extension Road',
    pincode: '122101',
    lat: 28.402,
    lng: 77.0705,
    totalUnits: 900,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Emaar Emerald Hills',
    slug: 'emaar-emerald-hills-gurgaon',
    address: 'Sector 65, Golf Course Extension Road',
    pincode: '122101',
    lat: 28.4105,
    lng: 77.071,
    totalUnits: 1200,
    amenities: ['Club House', 'Park', 'Power Backup', 'Security', 'Jogging Track'],
  },
  {
    name: 'M3M Golf Estate',
    slug: 'm3m-golf-estate-gurgaon',
    address: 'Sector 65, Golf Course Extension Road',
    pincode: '122101',
    lat: 28.4112,
    lng: 77.0735,
    totalUnits: 1100,
    amenities: [
      'Swimming Pool',
      'Gym',
      'Club House',
      'Golf Course View',
      'Power Backup',
      'Security',
    ],
  },
  {
    name: 'Ireo Grand Arch',
    slug: 'ireo-grand-arch-gurgaon',
    address: 'Sector 58, Golf Course Extension Road',
    pincode: '122011',
    lat: 28.4225,
    lng: 77.1015,
    totalUnits: 800,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Ireo Skyon',
    slug: 'ireo-skyon-gurgaon',
    address: 'Sector 60, Golf Course Extension Road',
    pincode: '122102',
    lat: 28.4135,
    lng: 77.0855,
    totalUnits: 600,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Power Backup', 'Security'],
  },
  {
    name: 'Mahindra Luminare',
    slug: 'mahindra-luminare-gurgaon',
    address: 'Sector 59, Golf Course Extension Road',
    pincode: '122102',
    lat: 28.4198,
    lng: 77.0915,
    totalUnits: 280,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Concierge', 'Power Backup', 'Security'],
  },
  {
    name: 'Central Park Resorts',
    slug: 'central-park-resorts-gurgaon',
    address: 'Sector 48, Sohna Road',
    pincode: '122018',
    lat: 28.4118,
    lng: 77.039,
    totalUnits: 1500,
    amenities: [
      'Swimming Pool',
      'Gym',
      'Club House',
      'Spa',
      'Power Backup',
      'Security',
      'Mini Golf',
    ],
  },
  {
    name: 'Tata Primanti',
    slug: 'tata-primanti-gurgaon',
    address: 'Sector 72, Southern Peripheral Road',
    pincode: '122004',
    lat: 28.3925,
    lng: 77.0608,
    totalUnits: 1000,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Sobha International City',
    slug: 'sobha-international-city-gurgaon',
    address: 'Sector 109, Dwarka Expressway',
    pincode: '122017',
    lat: 28.503,
    lng: 76.992,
    totalUnits: 1200,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Raheja Atlantis',
    slug: 'raheja-atlantis-gurgaon',
    address: 'Sector 31-32A, NH-8',
    pincode: '122001',
    lat: 28.4602,
    lng: 77.0508,
    totalUnits: 500,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
  {
    name: 'Nirvana Country',
    slug: 'nirvana-country-gurgaon',
    address: 'Sector 50, South City 2',
    pincode: '122018',
    lat: 28.4135,
    lng: 77.0625,
    totalUnits: 1300,
    amenities: ['Swimming Pool', 'Club House', 'Park', 'Power Backup', 'Security', 'Market'],
  },
  {
    name: 'Unitech Uniworld City',
    slug: 'unitech-uniworld-city-gurgaon',
    address: 'Sector 30, NH-8',
    pincode: '122001',
    lat: 28.471,
    lng: 77.062,
    totalUnits: 1100,
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
  },
];

async function main() {
  console.log(`Seeding ${GURGAON_SOCIETIES.length} Gurgaon societies...`);

  let created = 0;
  for (const s of GURGAON_SOCIETIES) {
    const existing = await prisma.society.findUnique({ where: { slug: s.slug } });
    await prisma.society.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        address: s.address,
        pincode: s.pincode,
        lat: s.lat,
        lng: s.lng,
        totalUnits: s.totalUnits,
        amenities: s.amenities,
      },
      create: {
        name: s.name,
        slug: s.slug,
        address: s.address,
        city: 'Gurugram',
        state: 'Haryana',
        pincode: s.pincode,
        lat: s.lat,
        lng: s.lng,
        totalUnits: s.totalUnits,
        amenities: s.amenities,
        verificationStatus: 'VERIFIED',
        status: 'ONBOARDED',
      },
    });
    console.log(`  ${existing ? 'updated' : 'created'}: ${s.name}`);
    if (!existing) created++;
  }

  console.log(
    `Gurgaon seed complete. ${created} new, ${GURGAON_SOCIETIES.length - created} updated.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
