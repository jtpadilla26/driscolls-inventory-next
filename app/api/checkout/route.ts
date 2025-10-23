// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serviceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  throw new Error('Supabase credentials are not configured for the checkout API route.');
}

const supabase = createClient(url, serviceKey);

const checkoutItemSchema = z.object({
  item_id: z.string().uuid(),
  location_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  user_id: z.string().uuid(),
  purpose: z.string().trim().min(1, 'Purpose is required'),
  return_date: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length ? value : undefined)),
  items: z.array(checkoutItemSchema).min(1, 'At least one cart item is required'),
});

function normalizeReturnDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error('Invalid return_date. Expected a valid date string.');
  }
  return parsed.toISOString();
}

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = checkoutSchema.safeParse(payload);
  if (!result.success) {
    const { fieldErrors, formErrors } = result.error.flatten();
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors, formErrors },
      { status: 400 }
    );
  }

  const data = result.data;

  // Ensure no duplicate (item, location) combinations made it through validation.
  const compositeKeys = new Set<string>();
  for (const item of data.items) {
    const key = `${item.item_id}:${item.location_id}`;
    if (compositeKeys.has(key)) {
      return NextResponse.json(
        { error: 'Duplicate item/location pair detected in cart' },
        { status: 400 }
      );
    }
    compositeKeys.add(key);
  }

  const normalizedReturnDate = (() => {
    try {
      return normalizeReturnDate(data.return_date);
    } catch (error) {
      return error instanceof Error
        ? NextResponse.json({ error: error.message }, { status: 400 })
        : NextResponse.json({ error: 'Invalid return_date' }, { status: 400 });
    }
  })();

  if (normalizedReturnDate instanceof NextResponse) {
    return normalizedReturnDate;
  }

  try {
    const itemIds = Array.from(new Set(data.items.map((item) => item.item_id)));
    const locationIds = Array.from(new Set(data.items.map((item) => item.location_id)));

    const [
      { data: existingItems, error: itemsError },
      { data: existingLocations, error: locationsError },
    ] = await Promise.all([
      supabase.from('inventory_items').select('id').in('id', itemIds),
      supabase.from('locations').select('id').in('id', locationIds),
    ]);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
    if (locationsError) {
      return NextResponse.json({ error: locationsError.message }, { status: 500 });
    }

    if ((existingItems?.length ?? 0) !== itemIds.length) {
      return NextResponse.json(
        { error: 'One or more items could not be found' },
        { status: 400 }
      );
    }
    if ((existingLocations?.length ?? 0) !== locationIds.length) {
      return NextResponse.json(
        { error: 'One or more locations could not be found' },
        { status: 400 }
      );
    }

    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .insert({
        user_id: data.user_id,
        purpose: data.purpose,
        return_date: normalizedReturnDate,
      })
      .select()
      .single();

    if (checkoutError) {
      return NextResponse.json({ error: checkoutError.message }, { status: 400 });
    }

    const checkoutItemsPayload = data.items.map((item) => ({
      checkout_id: checkout.id,
      item_id: item.item_id,
      location_id: item.location_id,
      quantity: item.quantity,
    }));

    const { data: checkoutItems, error: checkoutItemsError } = await supabase
      .from('checkout_items')
      .insert(checkoutItemsPayload)
      .select();

    if (checkoutItemsError) {
      await supabase.from('checkouts').delete().eq('id', checkout.id);
      return NextResponse.json({ error: checkoutItemsError.message }, { status: 400 });
    }

    return NextResponse.json({ ...checkout, items: checkoutItems }, { status: 201 });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
