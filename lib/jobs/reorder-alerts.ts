// lib/jobs/reorder-alerts.ts
import { createServerClient } from '@/lib/supabase/server';

type ReorderCandidate = {
  id: string;
  name: string;
  reorder_point: number | null;
  stock_levels: { quantity: number }[] | null;
  categories: { name: string | null } | null;
};

async function sendReorderAlerts(items: ReorderCandidate[]): Promise<void> {
  // Placeholder implementation – integrate with email/Slack provider when available.
  for (const item of items) {
    // eslint-disable-next-line no-console
    console.info('Reorder alert', {
      id: item.id,
      name: item.name,
      reorder_point: item.reorder_point,
      quantity: item.stock_levels?.[0]?.quantity ?? null,
      category: item.categories?.name ?? null,
    });
  }
}

export async function checkReorderPoints(): Promise<void> {
  const supabase = createServerClient();

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select(
      `
        id,
        name,
        reorder_point,
        stock_levels (quantity),
        categories (name)
      `,
    )
    .lt('stock_levels.quantity', 'reorder_point')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch items needing reorder: ${error.message}`);
  }

  if (!items || items.length === 0) {
    return;
  }

  await sendReorderAlerts(items as ReorderCandidate[]);
}
