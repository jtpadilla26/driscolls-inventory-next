"use client";

import { useState } from "react";
import { parseFile, buildPayload, upsertItems } from "@/lib/importers/items";

export default function ImportItemsPage() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setLog(["Reading file…"]);

    try {
      const rows = await parseFile(file);
      setLog((x) => [...x, `Parsed ${rows.length} rows`]);

      const { payload, errors } = await buildPayload(rows);
      if (errors.length) {
        setLog((x) => [...x, "Issues found:", ...errors]);
      }

      setLog((x) => [...x, `Upserting ${payload.length} items…`]);
      const { error, count } = await upsertItems(payload);
      if (error) throw new Error(error.message);

      setLog((x) => [...x, `Done. Upserted ${count} items.`]);
    } catch (err: any) {
      setLog((x) => [...x, `ERROR: ${err.message || String(err)}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Import Items</h1>
      <p className="opacity-80">
        Upload your Excel/CSV. Columns supported:
        <code className="ml-2">name, category, units, unit_type, price_per_unit, total_value (ignored), location, date_added, notes</code>
      </p>

      <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={onFile}
             className="block rounded border border-white/20 p-2 bg-black/20" />

      <div className="rounded border border-white/10 p-3 text-sm whitespace-pre-wrap">
        {log.length ? log.join("\n") : "No activity yet."}
      </div>
    </main>
  );
}
