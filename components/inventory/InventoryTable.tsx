'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { InventoryItem } from '@/lib/types';

type Props = {
  data: InventoryItem[];
  columns: ColumnDef<InventoryItem>[];
};

export default function InventoryTable({ data, columns }: Props) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="text-left p-3 font-medium">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(r => (
            <tr key={r.id} className="border-t">
              {r.getVisibleCells().map(c => (
                <td key={c.id} className="p-3">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
