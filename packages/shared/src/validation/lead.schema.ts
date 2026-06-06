import { z } from 'zod';

export const createLeadSchema = z.object({
  propertyId: z.string().uuid(),
  source: z.enum(['APP_SEARCH', 'REFERRAL', 'WHATSAPP', 'WALK_IN']),
});

export const updateLeadSchema = z
  .object({
    status: z
      .enum([
        'NEW',
        'CONTACTED',
        'NOT_PICKED',
        'INTERESTED',
        'QUALIFIED',
        'VISIT_SCHEDULED',
        'VISITED',
        'NEGOTIATING',
        'MEETING_ARRANGED',
        'DEAL_OPEN',
        'CLOSING',
        'CLOSED',
        'LOST',
      ])
      .optional(),
    visitDate: z.string().datetime().optional(),
    notes: z.record(z.unknown()).optional(),
  })
  .refine((v) => v.status !== 'VISIT_SCHEDULED' || !!v.visitDate, {
    message: 'visitDate is required when status is VISIT_SCHEDULED',
    path: ['visitDate'],
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
