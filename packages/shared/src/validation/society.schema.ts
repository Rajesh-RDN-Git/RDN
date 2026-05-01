import { z } from 'zod';

export const createSocietySchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  address: z.string().min(5),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  totalUnits: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateSocietySchema = createSocietySchema.partial().omit({ slug: true }).extend({
  // SUPER_ADMIN-only — assigning the RWA admin for the society. Service-layer
  // enforces the role check; schema simply allows the field.
  rwaAdminId: z.string().uuid().nullable().optional(),
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>;
export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>;
