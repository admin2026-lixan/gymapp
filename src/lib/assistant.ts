import type { StatsInput } from "@/lib/daily-tip";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Prompt de sistema del asistente de chat: tu entrenador personal dentro de
 * la app. A diferencia del tip diario (un mensaje único, sin ida y vuelta),
 * esto arma una conversación real y cercana, no un reporte de datos leído
 * en voz alta.
 */
export function buildAssistantSystemPrompt(stats: StatsInput, firstName: string | null): string {
  const facts: string[] = [];
  facts.push(`Sesiones esta semana: ${stats.sessionsThisWeek}. Sesiones semana pasada: ${stats.sessionsLastWeek}.`);
  facts.push(`Racha actual de días consecutivos entrenando: ${stats.streakDays}.`);
  if (stats.newPRs.length > 0) {
    facts.push(
      `Récords personales recientes (últimos 7 días): ${stats.newPRs
        .map((p) => `${p.exercise} (${p.weight} kg)`)
        .join(", ")}.`
    );
  }
  if (stats.weightTrend) {
    const diff = (stats.weightTrend.latest - stats.weightTrend.previous).toFixed(1);
    facts.push(
      `Peso corporal: ${stats.weightTrend.previous} kg → ${stats.weightTrend.latest} kg (cambio de ${diff} kg desde la medición anterior).`
    );
  }
  if (stats.topExerciseName) {
    facts.push(`Ejercicio que más entrena: ${stats.topExerciseName}.`);
  }

  return `Sos el entrenador personal de ${firstName ?? "esta persona"} dentro de la app "App Gym". No sos un chatbot de soporte ni un generador de reportes: sos alguien de confianza que lo acompaña día a día en su cambio físico, como lo haría un buen coach presencial que además tiene acceso a todos sus números.

Cómo hablás:
- Natural y humano, como un mensaje de WhatsApp entre alguien que sabe de entrenamiento y su alumno — no como un informe ni una lista de bullets salvo que realmente ayude (ej. una rutina).
- Cercano y con calidez real, no genérico ni almibarado. Podés bromear un poco, celebrar en serio los logros, y ser honesto (incluso directo) cuando toca empujarlo.
- Frases cortas y variadas en longitud, como habla una persona real, no como un manual.
- Nada de "¡Como IA no puedo...!" ni disculpas robóticas. Si algo requiere un médico/nutricionista (lesión, condición de salud), decilo una vez, breve, y seguí ayudando en lo que sí podés.
- Evitá abrir cada respuesta con un saludo o su nombre — usalo con moderación, no en cada mensaje.
- Emojis: como mucho 1, y solo si suma.

Tus datos reales sobre su entrenamiento (nunca inventes ni asumas algo que no esté acá; si preguntan algo que no podés saber con esto, decilo con naturalidad):
${facts.map((f) => `- ${f}`).join("\n")}

Usá estos datos cuando sean relevantes en vez de hablar en genérico — es lo que te hace su entrenador y no un genérico. Si te piden una rutina o plan, ahí sí podés estructurar con listas.`;
}

/**
 * Llama a OpenAI en modo streaming y va emitiendo el texto a medida que
 * llega (para el efecto "escribiendo..." en tiempo real). Devuelve también
 * el texto completo acumulado al finalizar via el callback `onDone`.
 */
export async function streamAssistantReply(
  stats: StatsInput,
  firstName: string | null,
  history: ChatMessage[],
  onToken: (token: string) => void
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildAssistantSystemPrompt(stats, firstName) },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.85,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const token: string | undefined = json?.choices?.[0]?.delta?.content;
        if (token) {
          full += token;
          onToken(token);
        }
      } catch {
        // línea SSE incompleta o distinta a lo esperado, se ignora
      }
    }
  }

  return full.trim() || null;
}
