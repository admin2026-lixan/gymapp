import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { DailyTip } from "@/lib/types";

export type StatsInput = {
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  streakDays: number;
  newPRs: { exercise: string; weight: number }[];
  weightTrend: { latest: number; previous: number } | null;
  topExerciseName: string | null;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export function buildPrompt(stats: StatsInput): string {
  const facts: string[] = [];
  facts.push(`Sesiones esta semana: ${stats.sessionsThisWeek}. Sesiones semana pasada: ${stats.sessionsLastWeek}.`);
  facts.push(`Racha actual de días consecutivos entrenando: ${stats.streakDays}.`);
  if (stats.newPRs.length > 0) {
    facts.push(
      `Nuevos récords personales recientes: ${stats.newPRs
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

  return `Sos un asistente de entrenamiento breve, cercano y motivador para una persona que entrena gym, básquet y cuida su cambio físico.

Estos son los ÚNICOS datos reales disponibles sobre su semana (no inventes ni asumas nada que no esté acá):
${facts.map((f) => `- ${f}`).join("\n")}

Escribí UN tip del día en español, de 2 a 3 frases cortas, cercano y motivador (no genérico), que:
- Si hay datos suficientes, mencione un dato concreto de arriba (un número real).
- Si no hay suficientes datos (pocas sesiones registradas), anímalo a registrar su próximo entrenamiento.
- No uses emojis en exceso (máximo 1).
- No repitas literalmente "aquí tienes tu tip".
Respondé solo con el texto del tip, sin comillas.`;
}

export async function computeStats(supabase: SupabaseClient, userId: string): Promise<StatsInput> {
  const since = new Date();
  since.setDate(since.getDate() - 84);

  const [{ data: sessions }, { data: sets }, { data: metrics }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, type, started_at")
      .eq("user_id", userId)
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: true }),
    supabase
      .from("exercise_sets")
      .select("exercise_id, weight_kg, created_at, exercises(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("body_metrics")
      .select("measured_at, weight_kg")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(2),
  ]);

  const now = new Date();
  const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  let sessionsThisWeek = 0;
  let sessionsLastWeek = 0;
  const sessionDays = new Set<string>();
  for (const s of sessions ?? []) {
    const started = new Date(s.started_at);
    sessionDays.add(s.started_at.slice(0, 10));
    if (started >= thisWeekStart) sessionsThisWeek++;
    else if (started >= lastWeekStart) sessionsLastWeek++;
  }

  // Racha: días consecutivos (hasta hoy) con al menos una sesión
  let streakDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (sessionDays.has(cursor.toISOString().slice(0, 10))) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // PRs recientes: máximo histórico alcanzado en los últimos 7 días
  type SetRow = {
    exercise_id: string;
    weight_kg: number | null;
    created_at: string;
    exercises: { name: string } | { name: string }[] | null;
  };
  const maxBefore = new Map<string, number>();
  const newPRs: { exercise: string; weight: number }[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const row of (sets ?? []) as SetRow[]) {
    const weight = row.weight_kg ?? 0;
    const prevMax = maxBefore.get(row.exercise_id) ?? 0;
    if (weight > prevMax) {
      if (new Date(row.created_at) >= sevenDaysAgo) {
        const name = Array.isArray(row.exercises) ? row.exercises[0]?.name : row.exercises?.name;
        if (name) newPRs.push({ exercise: name, weight });
      }
      maxBefore.set(row.exercise_id, weight);
    }
  }

  const countByExercise = new Map<string, { name: string; count: number }>();
  for (const row of (sets ?? []) as SetRow[]) {
    const name = Array.isArray(row.exercises) ? row.exercises[0]?.name : row.exercises?.name;
    if (!name) continue;
    const cur = countByExercise.get(row.exercise_id) ?? { name, count: 0 };
    cur.count += 1;
    countByExercise.set(row.exercise_id, cur);
  }
  const topExerciseName =
    Array.from(countByExercise.values()).sort((a, b) => b.count - a.count)[0]?.name ?? null;

  const weightTrend =
    metrics && metrics.length === 2 && metrics[0].weight_kg != null && metrics[1].weight_kg != null
      ? { latest: metrics[0].weight_kg as number, previous: metrics[1].weight_kg as number }
      : null;

  return {
    sessionsThisWeek,
    sessionsLastWeek,
    streakDays,
    newPRs: newPRs.slice(0, 3),
    weightTrend,
    topExerciseName,
  };
}

/** Llama a OpenAI para redactar el tip a partir de las stats ya calculadas. */
export async function generateTipText(stats: StatsInput): Promise<string | null> {
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
        messages: [{ role: "user", content: buildPrompt(stats) }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const tipText: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    return tipText ?? null;
  } catch {
    return null;
  }
}

export function highlightTypeFor(stats: StatsInput): DailyTip["highlight_type"] {
  return stats.newPRs.length > 0 ? "pr" : stats.streakDays >= 3 ? "streak" : "general";
}

/**
 * Devuelve el tip del día del usuario actual (sesión con cookies), generándolo
 * con OpenAI y cacheándolo en `daily_tips` si todavía no existe uno para hoy.
 * Si no hay OPENAI_API_KEY configurada, devuelve null silenciosamente.
 */
export async function getOrCreateDailyTip(): Promise<DailyTip | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayStr();

  const { data: existing } = await supabase
    .from("daily_tips")
    .select("*")
    .eq("user_id", user.id)
    .eq("tip_date", today)
    .maybeSingle();

  if (existing) return existing as DailyTip;

  try {
    const stats = await computeStats(supabase, user.id);
    const tipText = await generateTipText(stats);
    if (!tipText) return null;

    const { data: saved } = await supabase
      .from("daily_tips")
      .upsert(
        { user_id: user.id, tip_date: today, tip_text: tipText, highlight_type: highlightTypeFor(stats) },
        { onConflict: "user_id,tip_date" }
      )
      .select("*")
      .single();

    return (saved as DailyTip) ?? null;
  } catch {
    return null;
  }
}
