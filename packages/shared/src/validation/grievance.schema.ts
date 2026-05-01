import { z } from 'zod';

export const createGrievanceSchema = z.object({
  category: z.enum([
    'DEALER_CONDUCT',
    'PROPERTY_MISMATCH',
    'COMMISSION',
    'SERVICE',
    'SAFETY',
    'OTHER',
  ]),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().min(10).max(5000),
  againstUserId: z.string().uuid().optional(),
  societyId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const updateGrievanceSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED']).optional(),
  resolutionNotes: z.string().max(5000).optional(),
  assignedTo: z.string().uuid().optional(),
});

export type CreateGrievanceInput = z.infer<typeof createGrievanceSchema>;
export type UpdateGrievanceInput = z.infer<typeof updateGrievanceSchema>;
