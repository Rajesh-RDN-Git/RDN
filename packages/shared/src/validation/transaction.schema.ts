import { z } from 'zod';

export const createTransactionSchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum(['RENT', 'SALE', 'RENEWAL']),
  dealValue: z.number().positive(),
});

export const queryTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  type: z.enum(['RENT', 'SALE', 'RENEWAL']).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  societyId: z.string().uuid().optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type QueryTransactionsInput = z.infer<typeof queryTransactionsSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
