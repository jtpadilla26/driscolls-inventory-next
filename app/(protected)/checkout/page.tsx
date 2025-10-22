// app/(protected)/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import * as z from 'zod';

import { cartToPayload, useCheckoutCart } from '@/lib/checkout/cart';
import type {
  CheckoutLineItem,
  CheckoutRecord,
  InventoryItem,
  Location,
} from '@/lib/types/database';

const checkoutSchema = z.object({
  user_id: z.string().uuid({ message: 'Please enter a valid user ID' }),
  purpose: z.string().trim().min(1, 'Purpose is required'),
  return_date: z.string().optional(),
  items: z.array(
    z.object({
      item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
      location_id: z.string().uuid(),
    })
  ),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutResponse extends CheckoutRecord {
  items: CheckoutLineItem[];
}

export default function CheckoutPage() {
  const supabase = useMemo(() => createClientComponentClient(), []);

  const {
    items: cart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalQuantity,
    isEmpty,
  } = useCheckoutCart();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      user_id: '',
      purpose: '',
      return_date: '',
      items: [],
    },
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [addQuantity, setAddQuantity] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [lastCheckout, setLastCheckout] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    setValue('items', cartToPayload(cart) as CheckoutFormValues['items']);
  }, [cart, setValue]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const [itemsResult, locationsResult] = await Promise.all([
          supabase
            .from('inventory_items')
            .select('id,name,sku,default_location_id')
            .order('name', { ascending: true }),
          supabase
            .from('locations')
            .select('id,name')
            .order('name', { ascending: true }),
        ]);

        if (itemsResult.error) throw itemsResult.error;
        if (locationsResult.error) throw locationsResult.error;

        if (!cancelled) {
          setInventoryItems(itemsResult.data ?? []);
          setLocations(locationsResult.data ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setOptionsError(
            error instanceof Error ? error.message : 'Failed to load items and locations.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const resetSelection = () => {
    setSelectedItemId('');
    setSelectedLocationId('');
    setAddQuantity(1);
  };

  const handleSelectItem: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const itemId = event.target.value;
    setSelectedItemId(itemId);

    if (!itemId) {
      setSelectedLocationId('');
      return;
    }

    const item = inventoryItems.find((candidate) => candidate.id === itemId);
    if (item?.default_location_id) {
      setSelectedLocationId(item.default_location_id);
    }
  };

  const handleAddItem = () => {
    setAddError(null);
    setApiError(null);

    if (!selectedItemId) {
      setAddError('Choose an item before adding it to the cart.');
      return;
    }

    if (!selectedLocationId) {
      setAddError('Choose a location for the selected item.');
      return;
    }

    const item = inventoryItems.find((candidate) => candidate.id === selectedItemId);
    const location = locations.find((candidate) => candidate.id === selectedLocationId);

    if (!item || !location) {
      setAddError('Selected item or location is no longer available.');
      return;
    }

    const quantity = Number.isFinite(addQuantity) ? Math.max(1, Math.floor(addQuantity)) : 1;

    addItem({
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      locationId: location.id,
      locationName: location.name,
      quantity,
    });

    resetSelection();
  };

  const onSubmit = handleSubmit(async (values) => {
    const itemsPayload = cartToPayload(cart);
    if (!itemsPayload.length) {
      setApiError('Add at least one item to the cart before submitting.');
      return;
    }

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, items: itemsPayload }),
      });

      const body = (await response.json().catch(() => null)) as CheckoutResponse | null;

      if (!response.ok) {
        const message = body?.error ?? 'Failed to create checkout record.';
        setApiError(typeof message === 'string' ? message : 'Checkout failed.');
        return;
      }

      if (body) {
        setLastCheckout(body);
      } else {
        setLastCheckout(null);
      }

      setApiSuccess('Checkout recorded successfully.');
      clearCart();
      reset({
        user_id: values.user_id,
        purpose: '',
        return_date: '',
        items: [],
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-2 text-sm text-white/70">
          Build a cart from active inventory items, capture the purpose for borrowing, and
          submit the request to log a checkout in Supabase.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium">
                User ID
              </label>
              <input
                id="user_id"
                type="text"
                placeholder="00000000-0000-0000-0000-000000000000"
                className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                {...register('user_id')}
              />
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-400">{errors.user_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium">
                Purpose
              </label>
              <textarea
                id="purpose"
                rows={3}
                className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                placeholder="Describe why these items are being checked out"
                {...register('purpose')}
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-400">{errors.purpose.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="return_date" className="block text-sm font-medium">
                Expected return date
              </label>
              <input
                id="return_date"
                type="date"
                className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                {...register('return_date')}
              />
              {errors.return_date && (
                <p className="mt-1 text-sm text-red-400">{errors.return_date.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add items to cart</h2>
              {loadingOptions && (
                <span className="text-xs uppercase tracking-wide text-white/60">Loading…</span>
              )}
            </div>

            {optionsError && (
              <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {optionsError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium" htmlFor="item">
                  Item
                </label>
                <select
                  id="item"
                  className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                  value={selectedItemId}
                  onChange={handleSelectItem}
                  disabled={loadingOptions || !inventoryItems.length}
                >
                  <option value="">Select an item</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.sku ? ` · SKU ${item.sku}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="location">
                  Location
                </label>
                <select
                  id="location"
                  className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                  value={selectedLocationId}
                  onChange={(event) => setSelectedLocationId(event.target.value)}
                  disabled={loadingOptions || !locations.length}
                >
                  <option value="">Select a location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="md:w-48">
                <label className="block text-sm font-medium" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border border-white/20 bg-black/40 p-2 text-sm"
                  value={addQuantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setAddQuantity(Number.isFinite(value) ? value : 1);
                  }}
                />
              </div>

              <div className="flex flex-1 gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loadingOptions || !inventoryItems.length || !locations.length}
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            {addError && (
              <p className="text-sm text-red-400">{addError}</p>
            )}
          </div>

          <div className="space-y-3">
            {apiError && (
              <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {apiError}
              </div>
            )}

            {apiSuccess && (
              <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {apiSuccess}
                {lastCheckout?.id && (
                  <span className="ml-2">
                    Reference ID:
                    <a
                      href={`/checkout/success/${lastCheckout.id}`}
                      className="ml-1 underline"
                    >
                      {lastCheckout.id}
                    </a>
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-blue-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Submitting…' : 'Submit checkout'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Cart summary</h2>
            <p className="mt-1 text-sm text-white/70">
              {isEmpty ? 'No items in cart yet.' : 'Review quantities before finalizing the checkout.'}
            </p>

            {isEmpty ? (
              <div className="mt-4 rounded border border-dashed border-white/20 p-4 text-center text-sm text-white/60">
                Items that you add will appear here.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-white/60">
                    <tr>
                      <th className="px-2 py-1">Item</th>
                      <th className="px-2 py-1">Location</th>
                      <th className="px-2 py-1 w-24">Quantity</th>
                      <th className="px-2 py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={`${item.itemId}-${item.locationId}`} className="border-t border-white/10">
                        <td className="px-2 py-2">
                          <div className="font-medium">{item.itemName}</div>
                          {item.sku && (
                            <div className="text-xs text-white/60">SKU {item.sku}</div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-sm text-white/80">{item.locationName}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded border border-white/20 bg-black/40 p-1 text-sm"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItemQuantity(
                                item.itemId,
                                item.locationId,
                                Number(event.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.itemId, item.locationId)}
                            className="text-sm text-red-300 hover:text-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Unique items</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-white/60">Total quantity</span>
              <span className="font-medium">{totalQuantity}</span>
            </div>

            {!isEmpty && (
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setValue('items', []);
                }}
                className="mt-4 w-full rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Clear cart
              </button>
            )}
          </div>

          {lastCheckout && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-emerald-100">
              <div className="font-semibold text-emerald-200">Most recent checkout</div>
              <div className="mt-1 text-emerald-200/80">
                {lastCheckout.created_at
                  ? new Date(lastCheckout.created_at).toLocaleString()
                  : 'Timestamp unavailable'}
              </div>
              <div className="mt-2">
                <span className="text-emerald-200/70">Items logged:</span>
                <ul className="mt-1 space-y-1 text-emerald-50">
                  {(lastCheckout.items ?? []).map((line) => {
                    const item = inventoryItems.find((candidate) => candidate.id === line.item_id);
                    const location = locations.find((candidate) => candidate.id === line.location_id);
                    return (
                      <li key={line.id}>
                        {item?.name ?? line.item_id} — {line.quantity} at{' '}
                        {location?.name ?? line.location_id}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
