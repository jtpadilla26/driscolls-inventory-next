// lib/sanitizeInventoryItem.ts
export type InventoryItemUpsert = {
  id?: string;
  name: string;
  category?: string | null;
  units?: string | null;
  unit_type?: "consumable" | "asset" | null;
  price_per_unit?: number | null;
  location?: string | null;
  date_added?: string | null;         // ISO yyyy-mm-dd (or null)
  notes?: string | null;
  expiration_date?: string | null;
  batch_lot?: string | null;
  opened_at?: string | null;
  msds_url?: string | null;
};

const num = (v: any) =>
  v === "" || v === null || v === undefined ? null : Number(v);

const str = (v: any) =>
  v === "" || v === null || v === undefined ? null : String(v);

const dateish = (v: any) => {
  const s = str(v);
  if (!s) return null;
  // accept dd/mm/yyyy or yyyy-mm-dd, normalize to yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  return s;
};

export function sanitizeInventoryItem(input: Record<string, any>): InventoryItemUpsert {
  // strip display-only or unknown fields (e.g., total_value)
  const {
    total_value: _tv,
    qty_on_hand: _qoh,
    unit_cost: _oldPrice, // legacy field name if present
    ...rest
  } = input ?? {};

  return {
    id: str(rest.id) ?? undefined,
    name: String(rest.name ?? "").trim(),
    category: str(rest.category),
    units: str(rest.units),
    unit_type: (rest.unit_type ?? null) as "consumable" | "asset" | null,
    price_per_unit: num(rest.price_per_unit ?? _oldPrice), // "" -> null
    location: str(rest.location),
    date_added: dateish(rest.date_added),
    notes: str(rest.notes),
    expiration_date: dateish(rest.expiration_date),
    batch_lot: str(rest.batch_lot),
    opened_at: dateish(rest.opened_at),
    msds_url: str(rest.msds_url),
  };
}
