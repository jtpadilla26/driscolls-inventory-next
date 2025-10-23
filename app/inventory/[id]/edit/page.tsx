import { notFound } from 'next/navigation';

import EditItemForm from '@/components/inventory/EditItemForm';
import { supabase } from '@/lib/supabase/client';
import type { InventoryItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string };
};

export default async function EditInventoryItemPage({ params }: PageProps) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Item</h1>
      <EditItemForm item={data as InventoryItem} />
    </main>
  );
}
