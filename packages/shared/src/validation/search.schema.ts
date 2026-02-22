import { z } from 'zod';

export const searchFiltersSchema = z.object({
  city: z.string().optional(),
  societyId: z.string().uuid().optional(),
  type: z.enum(['APARTMENT', 'COMMERCIAL', 'VILLA']).optional(),
  transactionType: z.enum(['RENT', 'SALE', 'BOTH']).optional(),
  bhk: z.number().int().positive().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  furnishing: z.enum(['FURNISHED', 'SEMI', 'UNFURNISHED']).optional(),
  availabilityStatus: z.enum(['AVAILABLE_NOW', 'AVAILABLE_FROM', 'UNDER_NOTICE']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['price_rent', 'price_sale', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
