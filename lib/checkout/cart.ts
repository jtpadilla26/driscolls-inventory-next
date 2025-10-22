'use client';

import { useMemo, useState } from 'react';

/**
 * Represents a single line item in the checkout cart UI.
 */
export interface CartItem {
  itemId: string;
  itemName: string;
  sku?: string | null;
  locationId: string;
  locationName: string;
  quantity: number;
  availableQuantity?: number | null;
}

/**
 * Payload that the checkout API expects for each item.
 */
export interface CartItemPayload {
  item_id: string;
  location_id: string;
  quantity: number;
}

function keyFromParts(itemId: string, locationId: string) {
  return `${itemId}:${locationId}`;
}

function keyOf(item: Pick<CartItem, 'itemId' | 'locationId'>) {
  return keyFromParts(item.itemId, item.locationId);
}

/**
 * Convert the cart UI model into the payload that the API route expects.
 */
export function cartToPayload(items: CartItem[]): CartItemPayload[] {
  return items.map((item) => ({
    item_id: item.itemId,
    location_id: item.locationId,
    quantity: item.quantity,
  }));
}

export interface UseCheckoutCartResult {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItemQuantity: (itemId: string, locationId: string, quantity: number) => void;
  removeItem: (itemId: string, locationId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalQuantity: number;
  isEmpty: boolean;
}

/**
 * Lightweight shared cart state for the checkout flow. Consumers can add,
 * update or remove items while we expose a derived summary that can be used
 * for UI badges or validation.
 */
export function useCheckoutCart(initialItems: CartItem[] = []): UseCheckoutCartResult {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const addItem = (item: CartItem) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (existing) => keyOf(existing) === keyOf(item)
      );

      if (existingIndex >= 0) {
        const next = [...current];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity + item.quantity,
          availableQuantity: item.availableQuantity ?? existing.availableQuantity,
        };
        return next;
      }

      return [...current, item];
    });
  };

  const updateItemQuantity = (itemId: string, locationId: string, quantity: number) => {
    const nextQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const targetKey = keyFromParts(itemId, locationId);
    setItems((current) =>
      current.map((item) =>
        keyOf(item) === targetKey ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const removeItem = (itemId: string, locationId: string) => {
    const targetKey = keyFromParts(itemId, locationId);
    setItems((current) => current.filter((item) => keyOf(item) !== targetKey));
  };

  const clearCart = () => setItems([]);

  const { totalItems, totalQuantity } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.totalItems += 1;
        acc.totalQuantity += item.quantity;
        return acc;
      },
      { totalItems: 0, totalQuantity: 0 }
    );
  }, [items]);

  return {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalQuantity,
    isEmpty: items.length === 0,
  };
}
