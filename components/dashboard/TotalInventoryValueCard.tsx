'use client';

import useSWR from 'swr';
import { gbp } from '@/lib/currency';

type InventorySummary = {
  total_inventory_value: number;
  total_items: number;
  total_units: number;
  low_stock_count?: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TotalInventoryValueCard() {
  const { data, error, isLoading } = useSWR<InventorySummary>('/api/inventory/summary', fetcher, {
    revalidateOnFocus: true,
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (error || !data) return <div className="text-red-600">Failed to load</div>;

  return (
    <div className="rounded-2xl p-4 shadow-sm border bg-card">
      <div className="text-sm text-muted-foreground">Total Inventory Value</div>
      <div className="mt-1 text-3xl font-semibold">{gbp.format(Number(data.total_inventory_value || 0))}</div>
      <div className="mt-2 text-xs text-muted-foreground">
        {data.total_items} items • {Number(data.total_units).toLocaleString('en-GB')} units
      </div>
    </div>
  );
}
