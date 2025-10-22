// lib/sanitizeItem.ts
export type ItemUpsert = {
  id?: string;
  name: string;
  category_id?: string | null;
  item_type?: "consumable" | "asset" | null;
  unit?: string | null;
  price_per_unit?: number | null;   // <-- renamed
  reorder_point?: number | null;
  par_level?: number | null;
  default_location_id?: string | null;
  supplier_id?: string | null;
  sku?: string | null;
  description?: string | null;
  is_active?: boolean | null;
};

export function sanitizeItemInput(input: Record<string, any>): ItemUpsert {
  const num = (v: any) =>
    v === "" || v === null || v === undefined ? null : Number(v);
  const str = (v: any) =>
    v === "" || v === null || v === undefined ? null : String(v);

  // strip computed/display-only fields
  const { total_value: _ignore, qty_on_hand: _qoh, unit_cost: _oldCost, ...rest } = input ?? {};

  return {
    id: str(rest.id) ?? undefined,
    name: String(rest.name ?? "").trim(),
    category_id: str(rest.category_id),
    item_type: (rest.item_type ?? null) as "consumable" | "asset" | null,
    unit: str(rest.unit),
    price_per_unit: num(rest.price_per_unit ?? _oldCost), // accepts old field name too
    reorder_point: num(rest.reorder_point),
    par_level: num(rest.par_level),
    default_location_id: str(rest.default_location_id),
    supplier_id: str(rest.supplier_id),
    sku: str(rest.sku),
    description: str(rest.description),
    is_active: rest.is_active ?? true,
  };
}
