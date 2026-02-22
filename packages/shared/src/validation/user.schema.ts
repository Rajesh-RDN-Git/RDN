import { z } from 'zod';

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
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
