import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/daily-tip";
import { streamAssistantReply, type ChatMessage } from "@/lib/assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HISTORY = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return new Response(JSON.stringify({ error: "missing message" }), { status: 400 });
  }
  if (message.length > 2000) {
    return new Response(JSON.stringify({ error: "message too long" }), { status: 400 });
  }

  // Guarda el mensaje del usuario primero, así queda registrado aunque falle la IA.
  const { error: insertUserError } = await supabase
    .from("assistant_messages")
    .insert({ user_id: user.id, role: "user", content: message });
  if (insertUserError) {
    return new Response(JSON.stringify({ error: "could not save message" }), { status: 500 });
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
  const firstName = (user.email ?? "").split("@")[0] || null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full: string | null = null;
      try {
        full = await streamAssistantReply(stats, firstName, history, (token) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        });
      } catch {
        full = null;
      }

      if (!full) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "El asistente no está disponible ahora mismo. Probá de nuevo en un rato.",
            })}\n\n`
          )
        );
        controller.close();
        return;
      }

      const { data: saved } = await supabase
        .from("assistant_messages")
        .insert({ user_id: user.id, role: "assistant", content: full })
        .select("id, role, content, created_at")
        .single();

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, message: saved })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
