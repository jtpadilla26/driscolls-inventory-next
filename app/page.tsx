import { supabase } from '@/lib/supabase/client';
import InventoryTable from '@/components/inventory/InventoryTable';
import { inventoryColumns } from '@/components/inventory/columns';
import TotalInventoryValueCard from '@/components/dashboard/TotalInventoryValueCard';
import LowStockCard from '@/components/dashboard/LowStockCard';
import type { InventoryItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from('inventory_items_enriched')
    .select('*')
    .order('name', { ascending: true });

  if (error) return <div className="text-red-600 p-4">Failed: {error.message}</div>;
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <TotalInventoryValueCard />
        <LowStockCard />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Inventory Snapshot</h2>
        <InventoryTable data={(data as InventoryItem[]) ?? []} columns={inventoryColumns} />
      </div>
    </main>
  );
}
