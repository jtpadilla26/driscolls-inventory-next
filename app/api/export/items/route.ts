export const runtime = "nodejs";
import { NextResponse } from "next/server";
import XlsxPopulate from "xlsx-populate";
import { readFile } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

export async function GET() {
  try {
    const buf = await readFile(process.cwd() + "/public/templates/items_template.xlsx");
    const wb = await XlsxPopulate.fromDataAsync(buf);

    // pull YOUR categories
    const { data: cats, error } = await supabase
      .from("categories")
      .select("name")
      .order("name", { ascending: true });
    if (error) throw error;

    // write into hidden Lists sheet (A2:A…)
    const lists = wb.sheet("Lists");
    lists.range("A2:A10000").clear();
    (cats ?? []).forEach((c, i) => lists.cell(2 + i, 1).value(c.name));

    const out = await wb.outputAsync();
    return new NextResponse(out, {
      headers: {
        "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":"attachment; filename=rankins-items.xlsx"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "export failed" }, { status: 500 });
  }
}
