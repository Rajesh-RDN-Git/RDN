import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users (one per role)
  const superAdmin = await prisma.user.upsert({
    where: { phone: '+919999900001' },
    update: {},
    create: {
      phone: '+919999900001',
      name: 'Super Admin',
      email: 'superadmin@rdn.dev',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const rwaAdmin = await prisma.user.upsert({
    where: { phone: '+919999900002' },
    update: {},
    create: {
      phone: '+919999900002',
      name: 'RWA Admin',
      email: 'rwaadmin@rdn.dev',
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
    },
  });

  const dealerUser = await prisma.user.upsert({
    where: { phone: '+919999900003' },
    update: {},
    create: {
      phone: '+919999900003',
      name: 'Dealer User',
      email: 'dealer@rdn.dev',
      role: 'DEALER',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919999900004' },
    update: {},
    create: {
      phone: '+919999900004',
      name: 'Property Owner',
      email: 'owner@rdn.dev',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+919999900005' },
    update: {},
    create: {
      phone: '+919999900005',
      name: 'Buyer Tenant',
      email: 'buyer@rdn.dev',
      role: 'BUYER_TENANT',
      status: 'ACTIVE',
    },
  });

  // Create 2 societies
  const society1 = await prisma.society.upsert({
    where: { slug: 'green-valley-apartments' },
    update: {},
    create: {
      name: 'Green Valley Apartments',
      slug: 'green-valley-apartments',
      address: '123 Main Road, Sector 50',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122018',
      totalUnits: 500,
      amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park'],
      rwaAdminId: rwaAdmin.id,
      status: 'ONBOARDED',
      verificationStatus: 'VERIFIED',
    },
  });

  await prisma.society.upsert({
    where: { slug: 'sunrise-towers' },
    update: {},
    create: {
      name: 'Sunrise Towers',
      slug: 'sunrise-towers',
      address: '456 Ring Road, Sector 75',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      totalUnits: 300,
      amenities: ['Gym', 'Tennis Court', 'Jogging Track'],
      status: 'IN_PROGRESS',
      verificationStatus: 'PENDING',
    },
  });

  // Create 1 dealer record linking dealer user to society
  const dealer = await prisma.dealer.upsert({
    where: {
      userId_societyId: {
        userId: dealerUser.id,
        societyId: society1.id,
      },
    },
    update: {},
    create: {
      userId: dealerUser.id,
      societyId: society1.id,
      kycStatus: 'APPROVED',
      rwaApprovalStatus: 'APPROVED',
      trainingStatus: 'COMPLETED',
      isActive: true,
    },
  });

  // Get owner user for property creation
  const ownerUser = await prisma.user.findUnique({
    where: { phone: '+919999900004' },
  });

  if (ownerUser) {
    // Create sample properties
    const prop1 = await prisma.property.upsert({
      where: {
        societyId_flatNumber_towerBlock: {
          societyId: society1.id,
          flatNumber: '401',
          towerBlock: 'Tower A',
        },
      },
      update: {},
      create: {
        societyId: society1.id,
        ownerId: ownerUser.id,
        assignedDealerId: dealer.id,
        flatNumber: '401',
        towerBlock: 'Tower A',
        type: 'APARTMENT',
        transactionType: 'RENT',
        bhk: 3,
        carpetArea: 1200,
        superArea: 1500,
        floor: 4,
        totalFloors: 12,
        facing: 'East',
        furnishing: 'SEMI',
        priceRent: 35000,
        securityDeposit: 100000,
        availabilityStatus: 'AVAILABLE_NOW',
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        amenities: ['Modular Kitchen', 'AC', 'Geyser'],
      },
    });

    await prisma.property.upsert({
      where: {
        societyId_flatNumber_towerBlock: {
          societyId: society1.id,
          flatNumber: '802',
          towerBlock: 'Tower B',
        },
      },
      update: {},
      create: {
        societyId: society1.id,
        ownerId: ownerUser.id,
        assignedDealerId: dealer.id,
        flatNumber: '802',
        towerBlock: 'Tower B',
        type: 'APARTMENT',
        transactionType: 'SALE',
        bhk: 4,
        carpetArea: 1800,
        superArea: 2200,
        floor: 8,
        totalFloors: 20,
        facing: 'North',
        furnishing: 'FURNISHED',
        priceSale: 15000000,
        availabilityStatus: 'AVAILABLE_NOW',
        verificationStatus: 'RWA_APPROVED',
        status: 'ACTIVE',
        amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Wooden Flooring'],
      },
    });

    await prisma.property.upsert({
      where: {
        societyId_flatNumber_towerBlock: {
          societyId: society1.id,
          flatNumber: '203',
          towerBlock: 'Tower A',
        },
      },
      update: {},
      create: {
        societyId: society1.id,
        ownerId: ownerUser.id,
        flatNumber: '203',
        towerBlock: 'Tower A',
        type: 'APARTMENT',
        transactionType: 'BOTH',
        bhk: 2,
        carpetArea: 900,
        superArea: 1100,
        floor: 2,
        totalFloors: 12,
        facing: 'West',
        furnishing: 'UNFURNISHED',
        priceRent: 22000,
        priceSale: 8500000,
        securityDeposit: 66000,
        availabilityStatus: 'AVAILABLE_FROM',
        availableFrom: new Date('2026-04-01'),
        verificationStatus: 'PENDING',
        status: 'ACTIVE',
      },
    });

    // Add sample media for first property
    await prisma.propertyMedia.createMany({
      data: [
        {
          propertyId: prop1.id,
          url: 'https://via.placeholder.com/800x600?text=Living+Room',
          type: 'PHOTO',
          order: 0,
        },
        {
          propertyId: prop1.id,
          url: 'https://via.placeholder.com/800x600?text=Bedroom',
          type: 'PHOTO',
          order: 1,
        },
        {
          propertyId: prop1.id,
          url: 'https://via.placeholder.com/800x600?text=Kitchen',
          type: 'PHOTO',
          order: 2,
        },
      ],
      skipDuplicates: true,
    });

    console.log('Properties seeded: 3 listings with media');
  }

  console.log('Seed completed successfully!');
  console.log('Test users:');
  console.log('  Super Admin:  +919999900001');
  console.log('  RWA Admin:    +919999900002');
  console.log('  Dealer:       +919999900003');
  console.log('  Owner:        +919999900004');
  console.log('  Buyer/Tenant: +919999900005');
  console.log('(Dev mode: any 6-digit OTP works)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
