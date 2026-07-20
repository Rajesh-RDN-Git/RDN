import { z } from 'zod';

// Optional fields submitted by HTML forms arrive as empty strings (''), which
// `z.string().email()` rejects. Accept '' (and undefined), then normalise blanks
// to undefined. Kept as a union (not z.preprocess) so the inferred input type
// stays `string | undefined` for react-hook-form resolvers.
const optionalEmail = z
  .string()
  .email('Invalid email address')
  .or(z.literal(''))
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .url()
  .or(z.literal(''))
  .optional()
  .transform((v) => (v ? v : undefined));

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const createUserSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/),
  name: z.string().min(2).max(255),
  email: optionalEmail,
  role: z.enum(['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: optionalEmail,
  avatarUrl: optionalUrl,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT']),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
