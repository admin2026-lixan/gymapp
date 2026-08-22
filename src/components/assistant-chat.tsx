"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IconBadge } from "@/components/icon-badge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const SUGGESTIONS = [
  "¿Cómo voy esta semana?",
  "Armame una rutina de piernas",
  "¿Qué como antes de entrenar?",
  "Dame un empujón para hoy",
];

/**
 * UI de chat con el entrenador IA, reutilizada tanto en la pantalla /assistant
 * como en el panel flotante (AssistantFab). Streamea la respuesta token a
 * token vía Server-Sent Events para el efecto "escribiendo en vivo".
 */
export function AssistantChat({ heightClass = "h-[calc(100dvh-8.5rem)]" }: { heightClass?: string }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("assistant_messages")
        .select("id, role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);

      setMessages((data as Message[]) ?? []);
      setLoadingHistory(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    setStreamingText("");

    const optimistic: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok || !res.body) throw new Error("No se pudo enviar el mensaje");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = JSON.parse(trimmed.slice(5).trim());
          if (payload.error) throw new Error(payload.error);
          if (payload.token) {
            acc += payload.token;
            setStreamingText(acc);
          }
          if (payload.done) {
            setMessages((prev) => [...prev, payload.message as Message]);
            setStreamingText(null);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
      setStreamingText(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`flex flex-col ${heightClass}`}>
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <motion.div
          animate={{ rotate: sending ? [0, -8, 8, -8, 0] : 0 }}
          transition={{ duration: 0.6, repeat: sending ? Infinity : 0 }}
        >
          <IconBadge icon={Bot} gradient="from-emerald-500/25 to-cyan-500/10" iconClassName="text-emerald-400" size="md" />
        </motion.div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Tu entrenador</h1>
          <p className="text-xs text-[var(--ink-muted)]">Basado en tus datos reales de entrenamiento</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {loadingHistory && (
          <p className="text-sm text-[var(--ink-muted)] text-center py-8">Cargando conversación...</p>
        )}

        {!loadingHistory && messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <IconBadge icon={Sparkles} gradient="from-emerald-500/25 to-cyan-500/10" iconClassName="text-emerald-400" size="lg" />
            <div>
              <p className="text-sm font-medium">Soy tu mano derecha en este cambio físico</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Preguntame lo que quieras sobre tu entrenamiento, progreso o rutina
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-secondary)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <IconBadge icon={Bot} gradient="from-emerald-500/25 to-cyan-500/10" iconClassName="text-emerald-400" size="sm" className="mt-0.5" />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 font-medium"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-primary)]"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <IconBadge icon={User} gradient="from-neutral-500/20 to-neutral-500/5" iconClassName="text-[var(--ink-secondary)]" size="sm" className="mt-0.5" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {streamingText !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-start">
            <IconBadge icon={Bot} gradient="from-emerald-500/25 to-cyan-500/10" iconClassName="text-emerald-400" size="sm" className="mt-0.5" />
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-primary)]">
              {streamingText.length === 0 ? (
                <span className="flex gap-1 items-center py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--ink-muted)]"
                    />
                  ))}
                </span>
              ) : (
                <>
                  {streamingText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-block w-[2px] h-[1em] bg-emerald-400 ml-0.5 align-middle"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 pt-2 border-t border-[var(--border)] shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribile algo a tu entrenador..."
          className="flex-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Enviar"
          className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 flex items-center justify-center disabled:opacity-40"
        >
          <Send size={18} strokeWidth={2.25} />
        </button>
      </form>
    </div>
  );
}
