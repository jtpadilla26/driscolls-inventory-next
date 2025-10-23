// lib/importers/items.ts
import * as XLSX from "xlsx";
import { sanitizeItemInput } from "@/lib/sanitizeItem";
import { supabase } from "@/lib/supabase/client";

// Helpers: case-insensitive maps
const norm = (s?: string) => (s ?? "").trim().replace(/\s+/g, " ");
const normCI = (s?: string) => norm(s).toLowerCase();

export async function getCategoryMap() {
  const { data, error } = await supabase.from("categories").select("id,name");
  if (error) throw error;
  const map = new Map<string, string>();
  (data ?? []).forEach((c) => map.set(normCI(c.name), c.id));
  return map;
}

export async function getLocationMap() {
  const { data, error } = await supabase.from("locations").select("id,name");
  if (error) throw error;
  const map = new Map<string, string>();
  (data ?? []).forEach((l) => map.set(normCI(l.name), l.id));
  return map;
}

// Parse a File (xlsx OR csv) into rows
export async function parseFile(file: File) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
  return rows;
}

/**
 * Map rows → inventory_items payload, resolve names to ids,
 * ignore total_value, allow blank price (becomes null).
 *
 * Expected column headers from your template/sheets:
 * name, category, units, unit_type, price_per_unit, total_value, location, date_added, notes
 */
export async function buildPayload(rows: any[]) {
  const cats = await getCategoryMap();
  const locs = await getLocationMap();

  const payload = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const categoryName = norm(r.category);
    const locationName = norm(r.location);

    const category_id = categoryName ? cats.get(normCI(categoryName)) ?? null : null;
    const default_location_id = locationName ? locs.get(normCI(locationName)) ?? null : null;

    // collect helpful errors but keep processing
    if (categoryName && !category_id) {
      errors.push(`Row ${i + 2}: Unknown category "${categoryName}"`);
    }
    if (locationName && !default_location_id) {
      errors.push(`Row ${i + 2}: Unknown location "${locationName}"`);
    }

    const item = sanitizeItemInput({
      name: r.name,
      category_id,
      item_type: r.unit_type || null,        // "consumable" | "asset"
      unit: r.units || null,
      price_per_unit: r.price_per_unit,      // "" → null handled by sanitizer
      reorder_point: r.reorder_point,
      par_level: r.par_level,
      default_location_id,
      supplier_id: null,
      sku: r.sku,
      description: r.notes,
      is_active: true,
      // IMPORTANT: we do NOT pass total_value here
    });

    payload.push(item);
  }

  return { payload, errors };
}

/** Upsert into your real table */
export async function upsertItems(payload: any[]) {
  if (!payload.length) return { error: null, count: 0 };
  const { error, count } = await supabase
    .from("inventory_items")
    .upsert(payload, { onConflict: "sku" }); // change conflict key if needed
  return { error, count: count ?? payload.length };
}
