'use client';

import useSWR from 'swr';
import { useState } from 'react';

type CatRow = { category: string; default_threshold: number | null };
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LowStockSettings() {
  const { data, error, mutate } = useSWR<CatRow[]>('/api/thresholds', fetcher);
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (category: string, val: string) => {
    setSaving(category);
    const payload = {
      category,
      default_threshold: val.trim() === '' ? null : Number(val.replace(/[^\d.\-]/g, '')),
    };
    await fetch('/api/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(null);
    mutate();
  };

  if (error) return <div className="text-red-600">Failed to load thresholds</div>;
  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h2 className="text-lg font-semibold">Low-stock thresholds by category</h2>
      <p className="text-sm text-muted-foreground">
        Leave blank to disable low-stock rules for a category. Set a number to enable a default.
        Per-item thresholds still override the category value.
      </p>
      <div className="grid gap-2">
        {data.map(row => (
          <div key={row.category} className="flex items-center gap-3">
            <div className="w-48">{row.category}</div>
            <input
              className="w-28 rounded border px-2 py-1 text-sm"
              placeholder="—"
              defaultValue={row.default_threshold == null ? '' : String(row.default_threshold)}
              onBlur={(e) => save(row.category, e.target.value)}
            />
            {saving === row.category ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
