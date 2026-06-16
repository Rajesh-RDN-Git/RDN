import { z } from 'zod';

export const applyDealerSchema = z.object({
  societyId: z.string().uuid(),
  bankAccountDetails: z.record(z.unknown()).optional(),
});

// Admin (SUPER_ADMIN) manually onboards a dealer. Creates the user if the
// phone is new, then a PENDING dealer record for the society.
export const createDealerSchema = z.object({
  name: z.string().min(2).max(255),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
  email: z.string().email().optional().or(z.literal('')),
  societyId: z.string().uuid(),
  bankAccountDetails: z.record(z.unknown()).optional(),
});

// Accepts canonical `kycStatus` or alias `status`. Normalises to `kycStatus`.
export const updateDealerKycSchema = z
  .object({
    kycStatus: z.enum(['APPROVED', 'REJECTED']).optional(),
    status: z.enum(['APPROVED', 'REJECTED']).optional(),
  })
  .refine((v) => v.kycStatus !== undefined || v.status !== undefined, {
    message: 'kycStatus is required (APPROVED | REJECTED)',
    path: ['kycStatus'],
  })
  .transform((v) => ({ kycStatus: (v.kycStatus ?? v.status) as 'APPROVED' | 'REJECTED' }));

export type ApplyDealerInput = z.infer<typeof applyDealerSchema>;
export type CreateDealerInput = z.infer<typeof createDealerSchema>;
export type UpdateDealerKycInput = z.infer<typeof updateDealerKycSchema>;
