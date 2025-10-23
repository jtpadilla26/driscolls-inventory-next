import { supabase } from '@/lib/supabase/client';
import InventoryTable from '@/components/inventory/InventoryTable';
import { inventoryColumns } from '@/components/inventory/columns';
import type { InventoryItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const { data, error } = await supabase
    .from('inventory_items_enriched') // <-- use the view
    .select('*')
    .order('name', { ascending: true });

  if (error) return <div className="text-red-600 p-4">Failed: {error.message}</div>;
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <InventoryTable data={(data as InventoryItem[]) ?? []} columns={inventoryColumns} />
    </main>
  );
}
