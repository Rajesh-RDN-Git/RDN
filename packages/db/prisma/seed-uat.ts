import { PrismaClient } from '@prisma/client';
import { getFieldKeys } from '../src/field-crypto';
import { applyFieldEncryption, makeCipher } from '../src/field-encryption';

const prisma = new PrismaClient();
// Encrypt PII on write + remap phone lookups to the blind index, same as the API.
const cipher = makeCipher(getFieldKeys());
applyFieldEncryption(prisma, cipher);
// Look up existing users by the phone blind index (phone itself is encrypted, not unique).
const byPhone = (phone: string) => ({ phoneHash: cipher.blindIndex(phone) });

async function main() {
  console.log('Seeding UAT data...');

  // 2 societies
  const society1 = await prisma.society.upsert({
    where: { slug: 'green-valley-uat' },
    update: {},
    create: {
      name: 'Green Valley UAT',
      slug: 'green-valley-uat',
      address: 'Whitefield Main Road, Bengaluru 560066',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      totalUnits: 200,
      amenities: ['Pool', 'Gym', 'Park', 'Clubhouse', 'Children Play Area'],
      verificationStatus: 'VERIFIED',
      status: 'ONBOARDED',
    },
  });

  const society2 = await prisma.society.upsert({
    where: { slug: 'sunrise-heights-uat' },
    update: {},
    create: {
      name: 'Sunrise Heights UAT',
      slug: 'sunrise-heights-uat',
      address: 'Indiranagar 100ft Road, Bengaluru 560038',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      totalUnits: 120,
      amenities: ['Gym', 'Park', 'Clubhouse'],
      verificationStatus: 'VERIFIED',
      status: 'ONBOARDED',
    },
  });

  // SUPER_ADMIN
  await prisma.user.upsert({
    where: byPhone('+919999900001'),
    update: {},
    create: {
      phone: '+919999900001',
      name: 'UAT Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // RWA_ADMINs (one per society)
  const rwaGv = await prisma.user.upsert({
    where: byPhone('+919999900002'),
    update: { primarySocietyId: society1.id },
    create: {
      phone: '+919999900002',
      name: 'UAT RWA Admin GV',
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
      primarySocietyId: society1.id,
    },
  });

  const rwaSh = await prisma.user.upsert({
    where: byPhone('+919999900003'),
    update: { primarySocietyId: society2.id },
    create: {
      phone: '+919999900003',
      name: 'UAT RWA Admin SH',
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
      primarySocietyId: society2.id,
    },
  });

  // Bind societies to their RWA admins
  await prisma.society.update({ where: { id: society1.id }, data: { rwaAdminId: rwaGv.id } });
  await prisma.society.update({ where: { id: society2.id }, data: { rwaAdminId: rwaSh.id } });

  // OWNERs
  const owners = await Promise.all([
    prisma.user.upsert({
      where: byPhone('+919999900010'),
      update: { primarySocietyId: society1.id },
      create: {
        phone: '+919999900010',
        name: 'UAT Owner 1',
        role: 'OWNER',
        status: 'ACTIVE',
        primarySocietyId: society1.id,
      },
    }),
    prisma.user.upsert({
      where: byPhone('+919999900011'),
      update: { primarySocietyId: society1.id },
      create: {
        phone: '+919999900011',
        name: 'UAT Owner 2',
        role: 'OWNER',
        status: 'ACTIVE',
        primarySocietyId: society1.id,
      },
    }),
    prisma.user.upsert({
      where: byPhone('+919999900012'),
      update: { primarySocietyId: society2.id },
      create: {
        phone: '+919999900012',
        name: 'UAT Owner 3',
        role: 'OWNER',
        status: 'ACTIVE',
        primarySocietyId: society2.id,
      },
    }),
  ]);

  // DEALERs (User rows only; Dealer table records out of scope for seed)
  await prisma.user.upsert({
    where: byPhone('+919999900020'),
    update: { primarySocietyId: society1.id },
    create: {
      phone: '+919999900020',
      name: 'UAT Dealer GV',
      role: 'DEALER',
      status: 'ACTIVE',
      primarySocietyId: society1.id,
    },
  });
  await prisma.user.upsert({
    where: byPhone('+919999900021'),
    update: { primarySocietyId: society2.id },
    create: {
      phone: '+919999900021',
      name: 'UAT Dealer SH',
      role: 'DEALER',
      status: 'ACTIVE',
      primarySocietyId: society2.id,
    },
  });

  // 5 verified properties across both societies
  const propertiesData = [
    {
      society: society1,
      owner: owners[0],
      flat: 'A-101',
      tower: 'Tower A',
      tx: 'RENT' as const,
      bhk: 2,
      rent: 28000,
    },
    {
      society: society1,
      owner: owners[0],
      flat: 'A-205',
      tower: 'Tower A',
      tx: 'SALE' as const,
      bhk: 3,
      sale: 12000000,
    },
    {
      society: society1,
      owner: owners[1],
      flat: 'B-301',
      tower: 'Tower B',
      tx: 'RENT' as const,
      bhk: 1,
      rent: 18000,
    },
    {
      society: society2,
      owner: owners[2],
      flat: 'C-101',
      tower: 'Tower C',
      tx: 'BOTH' as const,
      bhk: 3,
      rent: 45000,
      sale: 18000000,
    },
    {
      society: society2,
      owner: owners[2],
      flat: 'C-202',
      tower: 'Tower C',
      tx: 'RENT' as const,
      bhk: 2,
      rent: 32000,
    },
  ];

  for (const p of propertiesData) {
    await prisma.property.upsert({
      where: {
        societyId_flatNumber_towerBlock: {
          societyId: p.society.id,
          flatNumber: p.flat,
          towerBlock: p.tower,
        },
      },
      update: {},
      create: {
        societyId: p.society.id,
        ownerId: p.owner.id,
        flatNumber: p.flat,
        towerBlock: p.tower,
        type: 'APARTMENT',
        transactionType: p.tx,
        bhk: p.bhk,
        carpetArea: 950,
        superArea: 1100,
        floor: 3,
        totalFloors: 12,
        facing: 'E',
        furnishing: 'SEMI',
        priceRent: p.rent,
        priceSale: p.sale,
        verificationStatus: 'VERIFIED',
        amenities: { Pool: true, Gym: true },
        restrictions: {},
      },
    });
  }

  console.log('UAT seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
