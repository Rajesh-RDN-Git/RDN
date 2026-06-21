import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Safety: this seed creates known test users (fixed phones, *.rdn.dev emails).
  // It must never run against production. Override only with an explicit flag.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error('Refusing to seed in production. Set ALLOW_PROD_SEED=true to override.');
  }

  console.log('Seeding database...');

  // ─── Users ──────────────────────────────────────────

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

  const rwaAdmin1 = await prisma.user.upsert({
    where: { phone: '+919999900002' },
    update: {},
    create: {
      phone: '+919999900002',
      name: 'Priya Sharma',
      email: 'priya.sharma@rdn.dev',
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
    },
  });

  const rwaAdmin2 = await prisma.user.upsert({
    where: { phone: '+919999900006' },
    update: {},
    create: {
      phone: '+919999900006',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@rdn.dev',
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
    },
  });

  const dealerUser1 = await prisma.user.upsert({
    where: { phone: '+919999900003' },
    update: {},
    create: {
      phone: '+919999900003',
      name: 'Amit Verma',
      email: 'amit.verma@rdn.dev',
      role: 'DEALER',
      status: 'ACTIVE',
    },
  });

  const dealerUser2 = await prisma.user.upsert({
    where: { phone: '+919999900007' },
    update: {},
    create: {
      phone: '+919999900007',
      name: 'Sneha Patel',
      email: 'sneha.patel@rdn.dev',
      role: 'DEALER',
      status: 'ACTIVE',
    },
  });

  const dealerUser3 = await prisma.user.upsert({
    where: { phone: '+919999900008' },
    update: {},
    create: {
      phone: '+919999900008',
      name: 'Vikram Singh',
      email: 'vikram.singh@rdn.dev',
      role: 'DEALER',
      status: 'ACTIVE',
    },
  });

  const ownerUser1 = await prisma.user.upsert({
    where: { phone: '+919999900004' },
    update: {},
    create: {
      phone: '+919999900004',
      name: 'Meera Iyer',
      email: 'meera.iyer@rdn.dev',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const ownerUser2 = await prisma.user.upsert({
    where: { phone: '+919999900009' },
    update: {},
    create: {
      phone: '+919999900009',
      name: 'Sanjay Gupta',
      email: 'sanjay.gupta@rdn.dev',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const buyerUser1 = await prisma.user.upsert({
    where: { phone: '+919999900005' },
    update: {},
    create: {
      phone: '+919999900005',
      name: 'Ananya Reddy',
      email: 'ananya.reddy@rdn.dev',
      role: 'BUYER_TENANT',
      status: 'ACTIVE',
    },
  });

  const buyerUser2 = await prisma.user.upsert({
    where: { phone: '+919999900010' },
    update: {},
    create: {
      phone: '+919999900010',
      name: 'Rohit Mehta',
      email: 'rohit.mehta@rdn.dev',
      role: 'BUYER_TENANT',
      status: 'ACTIVE',
    },
  });

  console.log('Users seeded: 10 users across 5 roles');

  // ─── Societies ──────────────────────────────────────

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
      lat: 28.4595,
      lng: 77.0266,
      totalUnits: 500,
      amenities: ['Swimming Pool', 'Gym', 'Club House', 'Park', 'Power Backup', 'Security'],
      rwaAdminId: rwaAdmin1.id,
      status: 'ONBOARDED',
      verificationStatus: 'VERIFIED',
      mandateStartDate: new Date('2025-01-01'),
      mandateEndDate: new Date('2027-12-31'),
    },
  });

  const society2 = await prisma.society.upsert({
    where: { slug: 'sunrise-towers' },
    update: {},
    create: {
      name: 'Sunrise Towers',
      slug: 'sunrise-towers',
      address: '456 Ring Road, Sector 75',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      lat: 28.5855,
      lng: 77.31,
      totalUnits: 300,
      amenities: ['Gym', 'Tennis Court', 'Jogging Track', 'Children Play Area', 'CCTV'],
      rwaAdminId: rwaAdmin2.id,
      status: 'ONBOARDED',
      verificationStatus: 'VERIFIED',
      mandateStartDate: new Date('2025-06-01'),
      mandateEndDate: new Date('2028-05-31'),
    },
  });

  console.log('Societies seeded: 2 societies');

  // ─── Dealers ────────────────────────────────────────

  const dealer1 = await prisma.dealer.upsert({
    where: { userId_societyId: { userId: dealerUser1.id, societyId: society1.id } },
    update: {},
    create: {
      userId: dealerUser1.id,
      societyId: society1.id,
      kycStatus: 'APPROVED',
      rwaApprovalStatus: 'APPROVED',
      trainingStatus: 'COMPLETED',
      isActive: true,
      bankAccountDetails: { accountNumber: '****1234', ifsc: 'HDFC0001234', bankName: 'HDFC Bank' },
    },
  });

  const dealer2 = await prisma.dealer.upsert({
    where: { userId_societyId: { userId: dealerUser2.id, societyId: society1.id } },
    update: {},
    create: {
      userId: dealerUser2.id,
      societyId: society1.id,
      kycStatus: 'APPROVED',
      rwaApprovalStatus: 'APPROVED',
      trainingStatus: 'COMPLETED',
      isActive: true,
      bankAccountDetails: {
        accountNumber: '****5678',
        ifsc: 'ICIC0005678',
        bankName: 'ICICI Bank',
      },
    },
  });

  const dealer3 = await prisma.dealer.upsert({
    where: { userId_societyId: { userId: dealerUser3.id, societyId: society2.id } },
    update: {},
    create: {
      userId: dealerUser3.id,
      societyId: society2.id,
      kycStatus: 'APPROVED',
      rwaApprovalStatus: 'PENDING',
      trainingStatus: 'PENDING',
      isActive: false,
    },
  });

  console.log('Dealers seeded: 3 dealers (2 active, 1 pending)');

  // ─── Properties ─────────────────────────────────────

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
      ownerId: ownerUser1.id,
      assignedDealerId: dealer1.id,
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
      amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Wardrobes'],
      viewsCount: 42,
    },
  });

  const prop2 = await prisma.property.upsert({
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
      ownerId: ownerUser1.id,
      assignedDealerId: dealer1.id,
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
      amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Wooden Flooring', 'Study Room'],
      viewsCount: 128,
    },
  });

  const prop3 = await prisma.property.upsert({
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
      ownerId: ownerUser2.id,
      assignedDealerId: dealer2.id,
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
      viewsCount: 15,
    },
  });

  const prop4 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society1.id,
        flatNumber: '1201',
        towerBlock: 'Tower C',
      },
    },
    update: {},
    create: {
      societyId: society1.id,
      ownerId: ownerUser2.id,
      assignedDealerId: dealer1.id,
      flatNumber: '1201',
      towerBlock: 'Tower C',
      type: 'APARTMENT',
      transactionType: 'RENT',
      bhk: 1,
      carpetArea: 550,
      superArea: 700,
      floor: 12,
      totalFloors: 15,
      facing: 'South',
      furnishing: 'FURNISHED',
      priceRent: 18000,
      securityDeposit: 54000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      amenities: ['AC', 'Geyser', 'Washing Machine', 'Bed', 'Sofa'],
      viewsCount: 67,
    },
  });

  const prop5 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society1.id,
        flatNumber: '505',
        towerBlock: 'Tower B',
      },
    },
    update: {},
    create: {
      societyId: society1.id,
      ownerId: ownerUser1.id,
      assignedDealerId: dealer2.id,
      flatNumber: '505',
      towerBlock: 'Tower B',
      type: 'APARTMENT',
      transactionType: 'SALE',
      bhk: 3,
      carpetArea: 1400,
      superArea: 1700,
      floor: 5,
      totalFloors: 20,
      facing: 'East',
      furnishing: 'SEMI',
      priceSale: 12000000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Balcony'],
      viewsCount: 89,
    },
  });

  const prop6 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society2.id,
        flatNumber: '301',
        towerBlock: 'Block A',
      },
    },
    update: {},
    create: {
      societyId: society2.id,
      ownerId: ownerUser1.id,
      flatNumber: '301',
      towerBlock: 'Block A',
      type: 'APARTMENT',
      transactionType: 'RENT',
      bhk: 2,
      carpetArea: 950,
      superArea: 1150,
      floor: 3,
      totalFloors: 10,
      facing: 'North',
      furnishing: 'SEMI',
      priceRent: 20000,
      securityDeposit: 60000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      amenities: ['AC', 'Geyser', 'Modular Kitchen'],
      viewsCount: 34,
    },
  });

  const prop7 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society2.id,
        flatNumber: '702',
        towerBlock: 'Block B',
      },
    },
    update: {},
    create: {
      societyId: society2.id,
      ownerId: ownerUser2.id,
      flatNumber: '702',
      towerBlock: 'Block B',
      type: 'APARTMENT',
      transactionType: 'SALE',
      bhk: 3,
      carpetArea: 1300,
      superArea: 1600,
      floor: 7,
      totalFloors: 12,
      facing: 'East',
      furnishing: 'FURNISHED',
      priceSale: 9500000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'RWA_APPROVED',
      status: 'ACTIVE',
      amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Wooden Flooring'],
      viewsCount: 55,
    },
  });

  const prop8 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society2.id,
        flatNumber: '104',
        towerBlock: 'Block A',
      },
    },
    update: {},
    create: {
      societyId: society2.id,
      ownerId: ownerUser2.id,
      flatNumber: '104',
      towerBlock: 'Block A',
      type: 'APARTMENT',
      transactionType: 'RENT',
      bhk: 1,
      carpetArea: 500,
      superArea: 650,
      floor: 1,
      totalFloors: 10,
      facing: 'South',
      furnishing: 'UNFURNISHED',
      priceRent: 12000,
      securityDeposit: 36000,
      availabilityStatus: 'UNDER_NOTICE',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      viewsCount: 22,
    },
  });

  const prop9 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society1.id,
        flatNumber: '1005',
        towerBlock: 'Tower C',
      },
    },
    update: {},
    create: {
      societyId: society1.id,
      ownerId: ownerUser1.id,
      assignedDealerId: dealer1.id,
      flatNumber: '1005',
      towerBlock: 'Tower C',
      type: 'APARTMENT',
      transactionType: 'SALE',
      bhk: 2,
      carpetArea: 1000,
      superArea: 1250,
      floor: 10,
      totalFloors: 15,
      facing: 'North',
      furnishing: 'SEMI',
      priceSale: 9000000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      amenities: ['Modular Kitchen', 'AC', 'Wardrobes'],
      viewsCount: 31,
    },
  });

  const prop10 = await prisma.property.upsert({
    where: {
      societyId_flatNumber_towerBlock: {
        societyId: society1.id,
        flatNumber: '601',
        towerBlock: 'Tower A',
      },
    },
    update: {},
    create: {
      societyId: society1.id,
      ownerId: ownerUser2.id,
      assignedDealerId: dealer2.id,
      flatNumber: '601',
      towerBlock: 'Tower A',
      type: 'APARTMENT',
      transactionType: 'RENT',
      bhk: 3,
      carpetArea: 1250,
      superArea: 1550,
      floor: 6,
      totalFloors: 12,
      facing: 'West',
      furnishing: 'FURNISHED',
      priceRent: 40000,
      securityDeposit: 120000,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      amenities: ['Modular Kitchen', 'AC', 'Geyser', 'Wardrobes', 'Washing Machine'],
      viewsCount: 95,
    },
  });

  console.log('Properties seeded: 10 listings');

  // ─── Property Media ─────────────────────────────────

  const mediaEntries = [
    {
      propertyId: prop1.id,
      url: 'https://via.placeholder.com/800x600?text=Living+Room',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop1.id,
      url: 'https://via.placeholder.com/800x600?text=Bedroom',
      type: 'PHOTO' as const,
      order: 1,
    },
    {
      propertyId: prop1.id,
      url: 'https://via.placeholder.com/800x600?text=Kitchen',
      type: 'PHOTO' as const,
      order: 2,
    },
    {
      propertyId: prop2.id,
      url: 'https://via.placeholder.com/800x600?text=Hall',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop2.id,
      url: 'https://via.placeholder.com/800x600?text=Master+Bedroom',
      type: 'PHOTO' as const,
      order: 1,
    },
    {
      propertyId: prop2.id,
      url: 'https://via.placeholder.com/800x600?text=Balcony+View',
      type: 'PHOTO' as const,
      order: 2,
    },
    {
      propertyId: prop2.id,
      url: 'https://via.placeholder.com/800x600?text=Kitchen',
      type: 'PHOTO' as const,
      order: 3,
    },
    {
      propertyId: prop4.id,
      url: 'https://via.placeholder.com/800x600?text=Studio+Main',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop4.id,
      url: 'https://via.placeholder.com/800x600?text=Kitchenette',
      type: 'PHOTO' as const,
      order: 1,
    },
    {
      propertyId: prop5.id,
      url: 'https://via.placeholder.com/800x600?text=Drawing+Room',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop5.id,
      url: 'https://via.placeholder.com/800x600?text=Bedroom+1',
      type: 'PHOTO' as const,
      order: 1,
    },
    {
      propertyId: prop6.id,
      url: 'https://via.placeholder.com/800x600?text=Sunrise+Living',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop7.id,
      url: 'https://via.placeholder.com/800x600?text=Sunrise+Master',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop9.id,
      url: 'https://via.placeholder.com/800x600?text=Compact+2BHK',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop10.id,
      url: 'https://via.placeholder.com/800x600?text=Premium+3BHK',
      type: 'PHOTO' as const,
      order: 0,
    },
    {
      propertyId: prop10.id,
      url: 'https://via.placeholder.com/800x600?text=Dining+Area',
      type: 'PHOTO' as const,
      order: 1,
    },
  ];

  // Delete existing media to avoid duplicates on re-seed
  await prisma.propertyMedia.deleteMany({
    where: { propertyId: { in: mediaEntries.map((m) => m.propertyId) } },
  });
  await prisma.propertyMedia.createMany({ data: mediaEntries });

  console.log('Media seeded: 16 photos across properties');

  // ─── Leads ──────────────────────────────────────────

  // Clean existing leads to avoid constraint issues on re-seed
  await prisma.transaction.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.lead.deleteMany({});

  const lead1 = await prisma.lead.create({
    data: {
      propertyId: prop1.id,
      buyerId: buyerUser1.id,
      dealerId: dealer1.id,
      societyId: society1.id,
      source: 'APP_SEARCH',
      status: 'NEW',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      propertyId: prop2.id,
      buyerId: buyerUser1.id,
      dealerId: dealer1.id,
      societyId: society1.id,
      source: 'APP_SEARCH',
      status: 'CONTACTED',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      propertyId: prop4.id,
      buyerId: buyerUser2.id,
      dealerId: dealer1.id,
      societyId: society1.id,
      source: 'REFERRAL',
      status: 'VISIT_SCHEDULED',
      visitDate: new Date('2026-04-05T10:00:00Z'),
      visitApprovedByOwner: true,
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      propertyId: prop5.id,
      buyerId: buyerUser2.id,
      dealerId: dealer2.id,
      societyId: society1.id,
      source: 'APP_SEARCH',
      status: 'NEGOTIATING',
      notes: [
        { text: 'Buyer interested, discussing price', date: '2026-03-10', by: 'dealer' },
        { text: 'Buyer offered 11.5L', date: '2026-03-12', by: 'dealer' },
      ],
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      propertyId: prop10.id,
      buyerId: buyerUser1.id,
      dealerId: dealer2.id,
      societyId: society1.id,
      source: 'WHATSAPP',
      status: 'CLOSING',
      notes: [
        { text: 'Tenant loved the property', date: '2026-03-08', by: 'dealer' },
        { text: 'Agreement terms finalized', date: '2026-03-15', by: 'dealer' },
      ],
    },
  });

  const lead6 = await prisma.lead.create({
    data: {
      propertyId: prop1.id,
      buyerId: buyerUser2.id,
      dealerId: dealer1.id,
      societyId: society1.id,
      source: 'APP_SEARCH',
      status: 'CLOSED',
    },
  });

  const lead7 = await prisma.lead.create({
    data: {
      propertyId: prop9.id,
      buyerId: buyerUser1.id,
      dealerId: dealer1.id,
      societyId: society1.id,
      source: 'APP_SEARCH',
      status: 'VISITED',
      visitDate: new Date('2026-03-01T11:00:00Z'),
      visitApprovedByOwner: true,
      notes: [{ text: 'Buyer visited, liked the flat', date: '2026-03-01', by: 'dealer' }],
    },
  });

  const lead8 = await prisma.lead.create({
    data: {
      propertyId: prop3.id,
      buyerId: buyerUser2.id,
      dealerId: dealer2.id,
      societyId: society1.id,
      source: 'WALK_IN',
      status: 'LOST',
      notes: [{ text: 'Buyer found another property', date: '2026-03-05', by: 'dealer' }],
    },
  });

  console.log('Leads seeded: 8 leads across all statuses');

  // ─── Transactions & Commissions ─────────────────────

  const txn1 = await prisma.transaction.create({
    data: {
      leadId: lead6.id,
      propertyId: prop1.id,
      type: 'RENT',
      dealValue: 35000,
      buyerCommission: 0,
      sellerCommission: 35000,
      gstAmount: 6300,
      rdnShare: 14000,
      dealerShare: 17500,
      rwaShare: 3500,
      paymentStatus: 'PAID',
      closedAt: new Date('2026-03-01'),
    },
  });

  const txn2 = await prisma.transaction.create({
    data: {
      leadId: lead5.id,
      propertyId: prop10.id,
      type: 'RENT',
      dealValue: 40000,
      buyerCommission: 0,
      sellerCommission: 40000,
      gstAmount: 7200,
      rdnShare: 16000,
      dealerShare: 20000,
      rwaShare: 4000,
      paymentStatus: 'PENDING',
      closedAt: new Date('2026-03-20'),
    },
  });

  await prisma.commission.create({
    data: {
      dealerId: dealer1.id,
      transactionId: txn1.id,
      amount: 17500,
      gst: 3150,
      status: 'SETTLED',
      settlementDate: new Date('2026-03-05'),
      payoutReference: 'PAY-2026-001',
    },
  });

  await prisma.commission.create({
    data: {
      dealerId: dealer2.id,
      transactionId: txn2.id,
      amount: 20000,
      gst: 3600,
      status: 'PENDING',
    },
  });

  console.log('Transactions seeded: 2 transactions, 2 commissions');

  // ─── Conversations & Messages ───────────────────────

  const conv1 = await prisma.conversation.create({
    data: {
      leadId: lead1.id,
      participants: [buyerUser1.id, dealerUser1.id],
      lastMessageAt: new Date('2026-03-20T14:30:00Z'),
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      leadId: lead4.id,
      participants: [buyerUser2.id, dealerUser2.id],
      lastMessageAt: new Date('2026-03-19T10:15:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: buyerUser1.id,
        receiverId: dealerUser1.id,
        content: 'Hi, I am interested in the 3BHK in Tower A. Is it still available?',
        type: 'TEXT',
        createdAt: new Date('2026-03-20T14:00:00Z'),
      },
      {
        conversationId: conv1.id,
        senderId: dealerUser1.id,
        receiverId: buyerUser1.id,
        content: 'Yes, the flat is available. Would you like to schedule a visit?',
        type: 'TEXT',
        createdAt: new Date('2026-03-20T14:15:00Z'),
      },
      {
        conversationId: conv1.id,
        senderId: buyerUser1.id,
        receiverId: dealerUser1.id,
        content: 'Yes please! How about this Saturday at 11 AM?',
        type: 'TEXT',
        createdAt: new Date('2026-03-20T14:30:00Z'),
      },
      {
        conversationId: conv2.id,
        senderId: buyerUser2.id,
        receiverId: dealerUser2.id,
        content: 'Can we discuss the price for the 3BHK in Tower B?',
        type: 'TEXT',
        createdAt: new Date('2026-03-19T10:00:00Z'),
      },
      {
        conversationId: conv2.id,
        senderId: dealerUser2.id,
        receiverId: buyerUser2.id,
        content:
          'Of course! The asking price is 1.2 Cr. Let me check with the owner about flexibility.',
        type: 'TEXT',
        createdAt: new Date('2026-03-19T10:15:00Z'),
      },
    ],
  });

  console.log('Conversations seeded: 2 conversations with 5 messages');

  // ─── Notifications ──────────────────────────────────

  await prisma.notification.createMany({
    data: [
      {
        userId: dealerUser1.id,
        type: 'LEAD',
        title: 'New Lead Assigned',
        body: 'A new enquiry for 3BHK, Tower A, 401 at Green Valley Apartments',
        channel: 'IN_APP',
        data: { leadId: lead1.id, propertyId: prop1.id },
      },
      {
        userId: buyerUser1.id,
        type: 'LEAD',
        title: 'Enquiry Received',
        body: 'Your enquiry for Green Valley Apartments has been received. A dealer will contact you soon.',
        channel: 'IN_APP',
        data: { leadId: lead1.id },
        readAt: new Date('2026-03-20T15:00:00Z'),
      },
      {
        userId: dealerUser1.id,
        type: 'COMMISSION',
        title: 'Commission Settled',
        body: 'Your commission of Rs 17,500 for rental deal at Tower A, 401 has been settled.',
        channel: 'IN_APP',
        data: { commissionId: txn1.id },
        readAt: new Date('2026-03-06T09:00:00Z'),
      },
      {
        userId: ownerUser1.id,
        type: 'VISIT',
        title: 'Visit Request',
        body: 'A buyer has requested to visit your property at Tower A, 401.',
        channel: 'IN_APP',
        data: { leadId: lead1.id, propertyId: prop1.id },
      },
      {
        userId: superAdmin.id,
        type: 'SYSTEM',
        title: 'New Society Application',
        body: 'Sunrise Towers has applied for onboarding.',
        channel: 'IN_APP',
        data: { societyId: society2.id },
      },
    ],
  });

  console.log('Notifications seeded: 5 notifications');

  // ─── Grievances ─────────────────────────────────────

  await prisma.grievance.create({
    data: {
      filedBy: buyerUser1.id,
      againstUserId: dealerUser1.id,
      societyId: society1.id,
      category: 'SERVICE',
      severity: 'MEDIUM',
      description: 'Dealer did not show up for the scheduled visit on March 5th.',
      evidenceUrls: [],
      status: 'OPEN',
      slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      assignedTo: rwaAdmin1.id,
    },
  });

  await prisma.grievance.create({
    data: {
      filedBy: buyerUser2.id,
      societyId: society1.id,
      transactionId: txn2.id,
      category: 'COMMISSION',
      severity: 'LOW',
      description: 'Commission amount seems incorrect for the rental agreement.',
      evidenceUrls: [],
      status: 'IN_PROGRESS',
      slaDeadline: new Date(Date.now() + 168 * 60 * 60 * 1000),
      assignedTo: superAdmin.id,
      resolutionNotes: 'Under review - checking commission calculation',
    },
  });

  console.log('Grievances seeded: 2 grievances');

  // ─── Referrals ──────────────────────────────────────

  await prisma.referral.create({
    data: {
      referrerId: dealerUser1.id,
      referredId: buyerUser2.id,
      referralCode: 'RDN-AMT001',
      status: 'SIGNED_UP',
    },
  });

  await prisma.referral.create({
    data: {
      referrerId: ownerUser1.id,
      referralCode: 'RDN-MIR002',
      status: 'PENDING',
    },
  });

  console.log('Referrals seeded: 2 referrals');

  // ─── Summary ────────────────────────────────────────

  console.log('\nSeed completed successfully!');
  console.log('Test users:');
  console.log('  Super Admin:   +919999900001 (superadmin@rdn.dev)');
  console.log('  RWA Admin 1:   +919999900002 (priya.sharma@rdn.dev)');
  console.log('  RWA Admin 2:   +919999900006 (rajesh.kumar@rdn.dev)');
  console.log('  Dealer 1:      +919999900003 (amit.verma@rdn.dev)');
  console.log('  Dealer 2:      +919999900007 (sneha.patel@rdn.dev)');
  console.log('  Dealer 3:      +919999900008 (vikram.singh@rdn.dev)');
  console.log('  Owner 1:       +919999900004 (meera.iyer@rdn.dev)');
  console.log('  Owner 2:       +919999900009 (sanjay.gupta@rdn.dev)');
  console.log('  Buyer 1:       +919999900005 (ananya.reddy@rdn.dev)');
  console.log('  Buyer 2:       +919999900010 (rohit.mehta@rdn.dev)');
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
