import { z } from 'zod';

export const toNumber = (v: unknown) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^\d.\-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export const InventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional().nullable(),
  units: z.union([z.number(), z.string()]).transform(toNumber).pipe(z.number().min(0)),
  unit_type: z.string().optional().nullable(),
  price_per_unit: z.union([z.number(), z.string()]).transform(toNumber).pipe(z.number().min(0)),
  location: z.string().optional().nullable(),

  // NEW: nullable threshold; treat empty string as null
  low_stock_threshold: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => {
      if (v === null || v === '') return null;
      if (typeof v === 'number') return v;
      const n = Number(v.replace(/[^\d.\-]/g, ''));
      return Number.isFinite(n) ? n : null;
    })
    .nullable(),

  date_added: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expiration_date: z.string().optional().nullable(),
  batch_lot: z.string().optional().nullable(),
  opened_at: z.string().optional().nullable(),
  msds_url: z.string().url().optional().nullable(),
});
