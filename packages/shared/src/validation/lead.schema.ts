import { z } from 'zod';

export const createLeadSchema = z.object({
  propertyId: z.string().uuid(),
  source: z.enum(['APP_SEARCH', 'REFERRAL', 'WHATSAPP', 'WALK_IN']),
});

export const updateLeadSchema = z.object({
  status: z
    .enum([
      'NEW',
      'CONTACTED',
      'VISIT_SCHEDULED',
      'VISITED',
      'NEGOTIATING',
      'CLOSING',
      'CLOSED',
      'LOST',
    ])
    .optional(),
  visitDate: z.string().datetime().optional(),
  notes: z.record(z.unknown()).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
