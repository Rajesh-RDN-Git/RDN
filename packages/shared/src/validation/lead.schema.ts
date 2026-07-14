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

// Super-admin manually adds a lead (e.g. a call-back prospect). Buyer/property
// are optional — a pure phone enquiry needn't be tied to a registered user yet.
export const createManualLeadSchema = z.object({
  contactName: z.string().min(1).max(120),
  contactPhone: z.string().min(6).max(20),
  source: z.enum(['MANUAL', 'CALLBACK', 'WHATSAPP', 'WALK_IN', 'REFERRAL']).default('MANUAL'),
  propertyId: z.string().uuid().optional(),
  societyId: z.string().uuid().optional(),
  dealerId: z.string().uuid().optional(),
  note: z.string().max(1000).optional(),
});

// Super-admin assigns / forwards a lead to a specific dealer.
export const assignLeadSchema = z.object({
  dealerId: z.string().uuid(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateManualLeadInput = z.infer<typeof createManualLeadSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
