import { z } from 'zod';

export const applyDealerSchema = z.object({
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
export type UpdateDealerKycInput = z.infer<typeof updateDealerKycSchema>;
