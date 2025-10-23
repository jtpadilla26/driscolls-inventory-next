// app/api/items/[id]/route.ts
import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { sanitizeInventoryItem } from '@/lib/sanitizeInventoryItem';

function validateInventoryItemInput(data: ReturnType<typeof sanitizeInventoryItem>): string | null {
  if (!data.name) {
    return 'Name is required';
  }

  return null;
}

interface RouteContext {
  params: { id: string };
}

export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const id = ctx?.params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const sanitized = sanitizeInventoryItem({ ...body, id });
    const validationError = validateInventoryItemInput(sanitized);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { id: _strip, ...payload } = sanitized;

    const supabase = createServerClient();
    const { data: updated, error } = await supabase
      .from('inventory_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
