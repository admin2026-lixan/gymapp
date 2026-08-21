import type { StatsInput } from "@/lib/daily-tip";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Prompt de sistema del asistente de chat. A diferencia del tip diario (un
 * mensaje único, sin ida y vuelta), esto arma una conversación real: el
 * usuario puede preguntar lo que quiera sobre su entrenamiento, pedir
 * consejos, o simplemente charlar sobre su cambio físico.
 */
export function buildAssistantSystemPrompt(stats: StatsInput): string {
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

  return `Sos el asistente personal de entrenamiento dentro de la app "App Gym". Sos la mano derecha del usuario en su cambio físico: cercano, motivador, directo, sin relleno innecesario.

Datos REALES disponibles sobre su entrenamiento (no inventes ni asumas nada que no esté acá; si te preguntan algo que no podés saber con estos datos, decilo con honestidad):
${facts.map((f) => `- ${f}`).join("\n")}

Reglas:
- Respondé en español, en tono cercano y motivador, sin emojis en exceso (máximo 1-2 por respuesta).
- Sé breve y concreto salvo que el usuario pida explícitamente una respuesta larga o detallada (ej. una rutina completa).
- Podés dar consejos generales de entrenamiento, nutrición básica, técnica y motivación, dejando claro que no reemplazás a un médico/nutricionista si la pregunta lo amerita (lesiones, condiciones médicas, etc.).
- Usá los datos reales de arriba cuando sean relevantes para la respuesta, en vez de hablar en genérico.`;
}

/** Llama a OpenAI con el historial completo de la conversación. */
export async function generateAssistantReply(
  stats: StatsInput,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildAssistantSystemPrompt(stats) },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    return text ?? null;
  } catch {
    return null;
  }
}
