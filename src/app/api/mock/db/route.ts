// Parte del MODO MOCK — puente HTTP para que el cliente mock del navegador
// (mock-client-browser.ts) opere sobre el mismo store en memoria que usan
// los Server Components (mock-engine.ts). Ver src/lib/supabase/mock-shared.ts.
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/supabase/mock-engine";
import type { MockOp } from "@/lib/supabase/mock-builder";

export async function POST(request: Request) {
  const op = (await request.json()) as MockOp;
  const result = await runQuery(op);
  return NextResponse.json(result);
}
