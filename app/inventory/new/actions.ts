'use server';

import { supabase } from '@/lib/supabase/client';
import { InventoryItemSchema, toNumber } from '@/lib/schema';

export async function createInventoryItem(formData: FormData) {
  const parsed = InventoryItemSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    units: formData.get('units'),
    unit_type: formData.get('unit_type'),
    price_per_unit: formData.get('price_per_unit'),
    location: formData.get('location'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    date_added: formData.get('date_added'),
    notes: formData.get('notes'),
    expiration_date: formData.get('expiration_date'),
    batch_lot: formData.get('batch_lot'),
    opened_at: formData.get('opened_at'),
    msds_url: formData.get('msds_url'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().fieldErrors };
  }

  const payload = parsed.data;

  const { error } = await supabase.from('inventory_items').insert([payload]);
  if (error) return { ok: false, error: { db: error.message } };

  return { ok: true };
}
