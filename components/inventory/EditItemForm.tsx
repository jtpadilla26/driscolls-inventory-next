'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import type { InventoryItem } from '@/lib/types';

const toNumOrNull = (v: FormDataEntryValue | null) => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const toNumber = (v: FormDataEntryValue | null, fallback: number) => {
  if (!v) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;
  const n = Number(s.replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

const toNullableString = (v: FormDataEntryValue | null) => {
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
};

type Props = {
  item: InventoryItem;
};

export default function EditItemForm({ item }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);
        const payload = {
          name: String(formData.get('name') ?? '').trim() || item.name,
          category: toNullableString(formData.get('category')),
          units: toNumber(formData.get('units'), item.units),
          unit_type: toNullableString(formData.get('unit_type')),
          price_per_unit: toNumber(formData.get('price_per_unit'), item.price_per_unit),
          location: toNullableString(formData.get('location')),
          date_added: toNullableString(formData.get('date_added')),
          notes: toNullableString(formData.get('notes')),
          expiration_date: toNullableString(formData.get('expiration_date')),
          batch_lot: toNullableString(formData.get('batch_lot')),
          opened_at: toNullableString(formData.get('opened_at')),
          msds_url: toNullableString(formData.get('msds_url')),
          low_stock_threshold: toNumOrNull(formData.get('low_stock_threshold')),
        } as const;

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', item.id);

        setSaving(false);

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setSuccess(true);
        router.refresh();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <input
            name="name"
            defaultValue={item.name}
            className="w-full rounded border px-2 py-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Category</label>
          <input
            name="category"
            defaultValue={item.category ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Units</label>
          <input
            name="units"
            defaultValue={item.units}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Unit Type</label>
          <input
            name="unit_type"
            defaultValue={item.unit_type ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Price per Unit</label>
          <input
            name="price_per_unit"
            defaultValue={item.price_per_unit}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Location</label>
          <input
            name="location"
            defaultValue={item.location ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Notes</label>
        <textarea
          name="notes"
          defaultValue={item.notes ?? ''}
          className="w-full rounded border px-2 py-2"
          rows={4}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Date Added</label>
          <input
            name="date_added"
            defaultValue={item.date_added ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Expiration Date</label>
          <input
            name="expiration_date"
            defaultValue={item.expiration_date ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Batch / Lot</label>
          <input
            name="batch_lot"
            defaultValue={item.batch_lot ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Opened At</label>
          <input
            name="opened_at"
            defaultValue={item.opened_at ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">MSDS URL</label>
          <input
            name="msds_url"
            defaultValue={item.msds_url ?? ''}
            className="w-full rounded border px-2 py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Low-stock Threshold (optional)</label>
        <input
          name="low_stock_threshold"
          placeholder="—"
          defaultValue={item.low_stock_threshold ?? ''}
          className="w-full rounded border px-2 py-2"
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use the category default (or disable low-stock for this item).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {success ? <span className="text-sm text-green-600">Saved!</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}
