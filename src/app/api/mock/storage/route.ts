// Parte del MODO MOCK — puente HTTP para subidas/lecturas de "storage"
// (fotos de progreso) desde el navegador. Ver src/lib/supabase/mock-shared.ts.
import { NextResponse } from "next/server";
import { runStorage, type MockStorageOp } from "@/lib/supabase/mock-engine";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const action = String(form.get("action"));
    const bucket = String(form.get("bucket"));
    const path = String(form.get("path"));
    if (action === "upload") {
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ data: null, error: { message: "Falta el archivo" } });
      const buf = Buffer.from(await file.arrayBuffer());
      const dataUrl = `data:${file.type || "application/octet-stream"};base64,${buf.toString("base64")}`;
      const result = await runStorage({ action: "upload", bucket, path, dataUrl });
      return NextResponse.json(result);
    }
    return NextResponse.json({ data: null, error: { message: "Acción no soportada" } });
  }

  const op = (await request.json()) as MockStorageOp;
  const result = await runStorage(op);
  return NextResponse.json(result);
}
