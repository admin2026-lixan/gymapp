import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/daily-tip";
import { generateAssistantReply, type ChatMessage } from "@/lib/assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HISTORY = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "missing message" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  }

  // Guarda el mensaje del usuario primero, así queda registrado aunque falle la IA.
  const { error: insertUserError } = await supabase
    .from("assistant_messages")
    .insert({ user_id: user.id, role: "user", content: message });
  if (insertUserError) {
    return NextResponse.json({ error: "could not save message" }, { status: 500 });
  }

  const { data: historyRows } = await supabase
    .from("assistant_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);

  const history: ChatMessage[] = (historyRows ?? [])
    .slice()
    .reverse()
    .map((r: { role: string; content: string }) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

  const stats = await computeStats(supabase, user.id);
  const reply = await generateAssistantReply(stats, history);

  if (!reply) {
    return NextResponse.json(
      { error: "El asistente no está disponible ahora mismo. Probá de nuevo en un rato." },
      { status: 503 }
    );
  }

  const { data: saved, error: insertAssistantError } = await supabase
    .from("assistant_messages")
    .insert({ user_id: user.id, role: "assistant", content: reply })
    .select("id, role, content, created_at")
    .single();

  if (insertAssistantError) {
    return NextResponse.json({ error: "could not save reply" }, { status: 500 });
  }

  return NextResponse.json({ message: saved });
}
