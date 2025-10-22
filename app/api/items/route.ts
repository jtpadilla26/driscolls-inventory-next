import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, items: [] });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  return NextResponse.json({ ok: true, received: payload });
}
