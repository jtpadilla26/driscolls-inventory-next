// lib/jobs/reorder-alerts.ts
//
// Purpose:
// - Normalize inventory items from whatever the DB/query returns
// - Ensure types are strict and compatible with usage in jobs/UI
// - Compute "reorder alerts" for items whose total quantity <= reorder point
//
// Fixes:
// - Enforces categories as Array<{ name: string | null }>
// - Normalizes stock levels to Array<{ quantity: number }>
// - Guards against any/nullable fields from DB responses

// -------- Types --------

type RawStockLevel = {
  quantity: unknown;
};

type RawCategory = {
  name?: unknown;
};

type RawItem = {
  id?: unknown;
  name?: unknown;
  reorder_point?: unknown;
  stock_levels?: RawStockLevel[] | null;
  categories?: RawCategory[] | null;
};

export type NormalizedStockLevel = {
  quantity: number;
};

export type NormalizedCategory = {
  name: string | null;
};

export type NormalizedItem = {
  id: string;
  name: string;
  reorder_point: number | null;
  stock_levels: NormalizedStockLevel[];
  categories: NormalizedCategory[];
};

export type ReorderAlert = {
  id: string;
  name: string;
  totalQuantity: number;
  reorderPoint: number;
  categories: NormalizedCategory[];
};

// -------- Helpers --------

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrZero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toStringSafe(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

// Strictly normalize one item from a loose/DB shape to our expected shape.
export function normalizeItem(raw: RawItem): NormalizedItem {
  const stock_levels_raw = Array.isArray(raw.stock_levels) ? raw.stock_levels : [];
  const categories_raw = Array.isArray(raw.categories) ? raw.categories : [];

  const stock_levels: NormalizedStockLevel[] = stock_levels_raw.map((s) => ({
    quantity: toNumberOrZero(s?.quantity),
  }));

  const categories: NormalizedCategory[] = categories_raw.map((c) => ({
    // enforce `string | null`
    name: c?.name == null ? null : toStringSafe(c.name),
  }));

  return {
    id: toStringSafe(raw.id),
    name: toStringSafe(raw.name),
    reorder_point: toNumberOrNull(raw.reorder_point),
    stock_levels,
    categories,
  };
}

// -------- Public API --------

/**
 * Compute reorder alerts for a list of raw items.
 * An alert is raised when totalQuantity <= reorder_point (and reorder_point is not null).
 */
export function getReorderAlerts(rawItems: RawItem[]): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];

  for (const raw of rawItems) {
    const item = normalizeItem(raw);

    // If no reorder point is defined, skip from alerting
    if (item.reorder_point == null) continue;

    const total = item.stock_levels.reduce((sum, s) => sum + (s.quantity || 0), 0);

    if (total <= item.reorder_point) {
      alerts.push({
        id: item.id,
        name: item.name,
        totalQuantity: total,
        reorderPoint: item.reorder_point,
        categories: item.categories,
      });
    }
  }

  return alerts;
}

/**
 * Convenience async wrapper if your caller awaits a job function.
 * Accepts either already-fetched items or a fetcher function returning RawItem[].
 */
export async function generateReorderAlerts(
  source: RawItem[] | (() => Promise<RawItem[]>)
): Promise<ReorderAlert[]> {
  const items = Array.isArray(source) ? source : await source();
  return getReorderAlerts(items);
}
