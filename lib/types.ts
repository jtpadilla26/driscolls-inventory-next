export type InventoryItem = {
  id: string;
  name: string;
  category: string | null;
  units: number;
  unit_type: string | null;
  price_per_unit: number;
  total_value?: number | null;
  location: string | null;
  // NEW:
  low_stock_threshold: number | null;
  effective_threshold?: number | null;
  is_low_stock?: boolean | null;

  date_added: string | null;
  notes: string | null;
  inserted_at: string | null;
  updated_at: string | null;
  expiration_date: string | null;
  batch_lot: string | null;
  opened_at: string | null;
  msds_url: string | null;
};

export type InventorySummary = {
  total_inventory_value: number;
  total_items: number;
  total_units: number;
  low_stock_count: number; // NEW
};
