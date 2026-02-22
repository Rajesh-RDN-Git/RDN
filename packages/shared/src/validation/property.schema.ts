import { z } from 'zod';

export const createPropertySchema = z.object({
  societyId: z.string().uuid(),
  flatNumber: z.string().min(1).max(50),
  towerBlock: z.string().min(1).max(100),
  type: z.enum(['APARTMENT', 'COMMERCIAL', 'VILLA']),
  transactionType: z.enum(['RENT', 'SALE', 'BOTH']),
  bhk: z.number().int().positive().optional(),
  carpetArea: z.number().positive().optional(),
  superArea: z.number().positive().optional(),
  floor: z.number().int().min(0).optional(),
  totalFloors: z.number().int().positive().optional(),
  facing: z.string().max(20).optional(),
  furnishing: z.enum(['FURNISHED', 'SEMI', 'UNFURNISHED']).optional(),
  priceRent: z.number().positive().optional(),
  priceSale: z.number().positive().optional(),
  securityDeposit: z.number().positive().optional(),
  availableFrom: z.string().datetime().optional(),
  restrictions: z.record(z.unknown()).optional(),
  amenities: z.record(z.unknown()).optional(),
});

export const updatePropertySchema = createPropertySchema.partial().omit({
  societyId: true,
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
