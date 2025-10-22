'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function LowStockCard() {
  const { data, error, isLoading } = useSWR<{ low_stock_count: number }>('/api/inventory/summary', fetcher, {
    revalidateOnFocus: true,
  });
  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (error || !data) return <div className="text-red-600">Failed to load</div>;

  return (
    <div className="rounded-2xl p-4 shadow-sm border bg-card">
      <div className="text-sm text-muted-foreground">Items with Low Stock</div>
      <div className="mt-1 text-3xl font-semibold">{data.low_stock_count ?? 0}</div>
      <div className="mt-2 text-xs text-muted-foreground">Based on per-item or category thresholds</div>
    </div>
  );
}
