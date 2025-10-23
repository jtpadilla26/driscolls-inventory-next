'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// ---- Local, minimal typings (match what this page actually uses) ----
type MinimalItem = {
  id: string;
  name: string;
  sku?: string | null;
  default_location_id?: string | null;
};

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

// ---- Create a browser Supabase client (no external imports needed) ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Guard against missing env vars to avoid runtime surprises
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[checkout/page] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export default function CheckoutPage() {
  const [itemsState, setItemsState] = useState<LoadState<MinimalItem[]>>({
    status: 'idle',
  });

  // Selected items for a hypothetical checkout (keyed by item id)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setItemsState({ status: 'loading' });

      // Select only the columns we actually use on this page.
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id,name,sku,default_location_id')
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        setItemsState({
          status: 'error',
          message: error.message ?? 'Failed to load items.',
        });
        return;
      }

      // Coerce into MinimalItem, ensuring the shape matches exactly.
      const minimal: MinimalItem[] = (data ?? []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? ''),
        sku: row.sku ?? null,
        default_location_id:
          row.default_location_id != null ? String(row.default_location_id) : null,
      }));

      setItemsState({ status: 'success', data: minimal });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allSelectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCheckout = async () => {
    // This is a placeholder. In your app, call your API route here with the
    // selected items. Keep payload shape narrow & typed locally on both ends.

    const chosenIds = Object.entries(selected)
      .filter(([, on]) => on)
      .map(([id]) => id);

    // Example POST (uncomment when you have an API route ready):
    // const res = await fetch('/api/stock/transaction', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ items: chosenIds }),
    // });
    // if (!res.ok) { /* show a toast or message */ }

    // For now, just log for visual confirmation.
    // eslint-disable-next-line no-console
    console.log('[checkout] submit items:', chosenIds);
    alert(
      chosenIds.length
        ? `Submitting ${chosenIds.length} item(s):\n\n${chosenIds.join('\n')}`
        : 'No items selected.'
    );
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <Link
          href="/dashboard"
          className="text-sm underline underline-offset-4 hover:opacity-80"
        >
          Back to Dashboard
        </Link>
      </header>

      {itemsState.status === 'loading' && (
        <p className="text-sm opacity-70">Loading items…</p>
      )}

      {itemsState.status === 'error' && (
        <div className="rounded-md border p-4 text-sm">
          <p className="font-medium text-red-600">Failed to load items</p>
          <p className="opacity-80 mt-1">{itemsState.message}</p>
        </div>
      )}

      {itemsState.status === 'success' && (
        <section className="rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Inventory (select to checkout)</h2>
            <span className="text-sm opacity-70">
              Selected: <strong>{allSelectedCount}</strong>
            </span>
          </div>

          {itemsState.data.length === 0 ? (
            <p className="text-sm opacity-70">No items found.</p>
          ) : (
            <ul className="divide-y">
              {itemsState.data.map((item) => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  <input
                    id={`sel-${item.id}`}
                    type="checkbox"
                    checked={!!selected[item.id]}
                    onChange={() => toggle(item.id)}
                    className="size-4"
                  />
                  <label
                    htmlFor={`sel-${item.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-70">
                      SKU: {item.sku ?? '—'} · Default location:{' '}
                      {item.default_location_id ?? '—'}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCheckout}
              className="rounded-md px-4 py-2 text-white bg-black hover:opacity-90 disabled:opacity-50"
              disabled={allSelectedCount === 0}
            >
              Submit checkout
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
