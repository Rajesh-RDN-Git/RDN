// Fixed, society-independent catalog of property attributes that an owner/dealer
// can pick while listing a property. Shared by web + mobile wizards so the option
// sets stay identical everywhere.

/** BHK options. "6+" is stored as the sentinel number 7. */
export const BHK_OPTIONS: { label: string; value: number }[] = [
  { label: '1 BHK', value: 1 },
  { label: '2 BHK', value: 2 },
  { label: '3 BHK', value: 3 },
  { label: '4 BHK', value: 4 },
  { label: '5 BHK', value: 5 },
  { label: '6 BHK', value: 6 },
  { label: '6+ BHK', value: 7 },
];

export const BHK_PLUS_SENTINEL = 7;

/** Render a stored bhk value back to a label (handles the 6+ sentinel). */
export function formatBhk(bhk?: number | null): string {
  if (bhk == null) return '';
  if (bhk >= BHK_PLUS_SENTINEL) return '6+ BHK';
  return `${bhk} BHK`;
}

/** Floor label overrides (in addition to a plain numeric floor). */
export const FLOOR_LABELS = ['GROUND', 'TOP'] as const;
export type FloorLabel = (typeof FLOOR_LABELS)[number];

/** Extra rooms beyond bedrooms/bath. */
export const ADDITIONAL_ROOMS: string[] = [
  'Puja Room',
  'Store Room',
  'Servant Room',
  'Garage',
  'Parking',
  'Balcony',
  'Study Room',
];

/** Flooring options (single-select, stored as a furnishing-style string). */
export const FLOORING_OPTIONS: string[] = [
  'Vitrified',
  'Marble',
  'Wooden',
  'Granite',
  'Ceramic',
  'Mosaic',
  'Cement',
];

/** Views the property looks out onto (multi-select). */
export const PROPERTY_VIEWS: string[] = [
  'Park Facing',
  'Park View',
  'Community View',
  'Pool Facing',
  'Club Facing',
  'Garden View',
  'Main Road',
];

/**
 * Furnishing items the owner can include, each with a count. Stored as
 * { "AC": 2, "Geyser": 1 }. Listed here as the pickable catalog.
 */
export const FURNISHING_ITEMS: string[] = [
  'Water Purifier',
  'Fan',
  'Exhaust Fan',
  'Geyser',
  'Stove',
  'Light',
  'Curtains',
  'Modular Kitchen',
  'Chimney',
  'AC',
  'Wardrobe',
  'Washing Machine',
  'Microwave',
  'Cooler',
  'Refrigerator',
  'TV',
];

/**
 * Society/building amenities grouped by category. Multi-select; stored on the
 * property as { "Gymnasium": true, "Lift": true, ... }.
 */
export const AMENITY_CATEGORIES: { category: string; items: string[] }[] = [
  {
    category: 'Sports',
    items: [
      'Gymnasium',
      'Swimming Pool',
      "Kids' Pool",
      'Badminton Court(s)',
      "Kids' Play Areas / Sand Pits",
      'Basketball',
      'Yoga Areas',
      'Jogging / Cycle Track',
      'Table Tennis',
      'Snooker/Pool/Billiards',
      'Squash Court',
    ],
  },
  {
    category: 'Convenience',
    items: [
      'Power Backup',
      'Treated Water Supply',
      '24*7 Water Supply',
      'Lift',
      'High Speed Elevators',
      'Service Elevators',
    ],
  },
  {
    category: 'Safety',
    items: [
      '24 x 7 Security',
      'CCTV / Video Surveillance',
      'Fire Fighting Systems',
      'Intercom Facility',
    ],
  },
  {
    category: 'Leisure',
    items: ['Party Hall', 'Clubhouse'],
  },
  {
    category: 'Environment',
    items: ['Rain Water Harvesting', 'Sewage Treatment Plant', 'Large Green Area'],
  },
];

/** Flat list of every amenity, handy for validation/lookup. */
export const ALL_AMENITIES: string[] = AMENITY_CATEGORIES.flatMap((c) => c.items);
