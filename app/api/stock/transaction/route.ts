// app/api/stock/transaction/route.ts
import { NextResponse } from 'next/server';

import { rateLimit } from "@/lib/rate-limiter";
import { createServerClient, getServerSession } from '@/lib/supabase/server';

const limiter = rateLimit({ limit: 100 });

function validateTransactionInput(body: Record<string, any>): string | null {
  if (!body || typeof body !== 'object') {
    return 'Invalid payload';
  }

  if (!body.item_id) {
    return 'Item ID is required';
  }

  if (!['in', 'out', 'adjustment', 'count'].includes(body.type)) {
    return 'Transaction type is invalid';
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 'Quantity must be a positive number';
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!limiter.check(session.user.id).success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const validationError = validateTransactionInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const quantity = Number(body.quantity);
    const unitCost =
      body.unit_cost === null || body.unit_cost === undefined
        ? null
        : Number(body.unit_cost);

    if (unitCost !== null && !Number.isFinite(unitCost)) {
      return NextResponse.json({ error: 'Unit cost must be numeric' }, { status: 400 });
    }

    const supabase = createServerClient();

    const insertPayload = {
      item_id: body.item_id,
      transaction_type: body.type,
      quantity,
      unit_cost: unitCost,
      location_id: body.location_id ?? null,
      user_id: session.user.id,
      notes: body.notes ?? null,
      reference_id: body.reference_id ?? null,
    };

    const {
      data: transaction,
      error: txError,
    } = await supabase.from('stock_transactions').insert(insertPayload).select().single();

    if (txError || !transaction) {
      return NextResponse.json(
        { error: txError?.message ?? 'Failed to create transaction' },
        { status: 400 },
      );
    }

    const { error: stockError } = await supabase.rpc('update_stock_level', {
      p_item_id: body.item_id,
      p_location_id: body.location_id,
      p_quantity: body.type === 'out' ? -quantity : quantity,
    });

    if (stockError) {
      await supabase.from('stock_transactions').delete().eq('id', transaction.id);
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
