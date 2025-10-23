'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import { supabase } from '@/lib/supabase/client';
import { gbp } from '@/lib/currency';
import type { InventoryItem } from '@/lib/types';

export function ThresholdCell({ row }: any) {
  const item = row.original as { id: string; low_stock_threshold: number | null };
  const [val, setVal] = useState(item.low_stock_threshold == null ? '' : String(item.low_stock_threshold));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const parsed = val.trim() === '' ? null : Number(val.replace(/[^\d.\-]/g, ''));
    await supabase.from('inventory_items').update({ low_stock_threshold: parsed }).eq('id', item.id);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-24 rounded border px-2 py-1 text-sm"
        placeholder="—"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
      />
      {saving ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
    </div>
  );
}

function LowBadge({ low }: { low: boolean | null | undefined }) {
  if (!low) return null;
  return <span className="ml-2 rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5">Low</span>;
}

export const inventoryColumns: ColumnDef<InventoryItem>[] = [
  {
    header: 'Item',
    accessorKey: 'name',
    cell: ({ row, getValue }) => (
      <div className="flex items-center">
        <span>{String(getValue() ?? '')}</span>
        <LowBadge low={row.original.is_low_stock} />
      </div>
    ),
  },
  { header: 'Category', accessorKey: 'category' },
  {
    header: 'Units',
    accessorKey: 'units',
    cell: ({ getValue }) => Number(getValue() ?? 0).toLocaleString('en-GB'),
  },
  { header: 'Unit', accessorKey: 'unit_type' },
  {
    header: 'Price',
    accessorKey: 'price_per_unit',
    cell: ({ getValue }) => gbp.format(Number(getValue() ?? 0)),
  },
  {
    header: 'Total Value',
    accessorKey: 'total_value',
    cell: ({ row }) =>
      gbp.format(Number(row.original.total_value ?? row.original.price_per_unit * row.original.units)),
  },
  { header: 'Effective Threshold', accessorKey: 'effective_threshold' },
  { header: 'Low-stock Threshold', cell: ThresholdCell },
  { header: 'Location', accessorKey: 'location' },
  {
    header: 'Actions',
    cell: ({ row }) => (
      <Link href={`/inventory/${row.original.id}/edit`} className="text-sm text-primary hover:underline">
        Edit
      </Link>
    ),
  },
];
