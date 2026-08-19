import { createClient } from "@/lib/supabase/server";
import { getOrCreateDailyTip } from "@/lib/daily-tip";
import DashboardClient from "./dashboard-client";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio de semana
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = new Date();
  since.setDate(since.getDate() - 84); // últimas 12 semanas

  const [{ data: sessions }, { data: metrics }, { data: sets }, { data: bballDetails }] =
    await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, type, started_at, duration_min")
        .gte("started_at", since.toISOString())
        .order("started_at", { ascending: true }),
      supabase
        .from("body_metrics")
        .select("measured_at, weight_kg, body_fat_pct")
        .order("measured_at", { ascending: true })
        .limit(60),
      supabase
        .from("exercise_sets")
        .select("exercise_id, weight_kg, reps, created_at, exercises(name)")
        .order("created_at", { ascending: true })
        .limit(500),
      supabase
        .from("basketball_details")
        .select("shots_made, shots_attempted, workout_sessions(started_at)")
        .order("created_at", { ascending: true })
        .limit(200),
    ]);

  // --- Frecuencia semanal por tipo ---
  const weekBuckets = new Map<string, { gym: number; basketball: number; cardio: number }>();
  for (const s of sessions ?? []) {
    const wk = startOfWeek(new Date(s.started_at)).toISOString().slice(0, 10);
    if (!weekBuckets.has(wk)) weekBuckets.set(wk, { gym: 0, basketball: 0, cardio: 0 });
    weekBuckets.get(wk)![s.type as "gym" | "basketball" | "cardio"] += 1;
  }
  const frequency = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({ week, ...v }));

  // --- Peso corporal en el tiempo ---
  const weightSeries = (metrics ?? [])
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ date: m.measured_at, weight: m.weight_kg as number }));

  const bodyFatSeries = (metrics ?? [])
    .filter((m) => m.body_fat_pct != null)
    .map((m) => ({ date: m.measured_at, fat: m.body_fat_pct as number }));

  // --- Progresión del ejercicio más registrado ---
  type SetRow = {
    exercise_id: string;
    weight_kg: number | null;
    reps: number | null;
    created_at: string;
    exercises: { name: string } | { name: string }[] | null;
  };
  const countByExercise = new Map<string, { name: string; count: number }>();
  for (const row of (sets ?? []) as SetRow[]) {
    const name = Array.isArray(row.exercises) ? row.exercises[0]?.name : row.exercises?.name;
    if (!name) continue;
    const cur = countByExercise.get(row.exercise_id) ?? { name, count: 0 };
    cur.count += 1;
    countByExercise.set(row.exercise_id, cur);
  }
  const topExerciseId = Array.from(countByExercise.entries()).sort(
    (a, b) => b[1].count - a[1].count
  )[0]?.[0];
  const topExerciseName = topExerciseId ? countByExercise.get(topExerciseId)!.name : null;

  const progressionByDay = new Map<string, number>();
  for (const row of (sets ?? []) as SetRow[]) {
    if (row.exercise_id !== topExerciseId || row.weight_kg == null) continue;
    const day = row.created_at.slice(0, 10);
    progressionByDay.set(day, Math.max(progressionByDay.get(day) ?? 0, row.weight_kg));
  }
  const exerciseProgression = Array.from(progressionByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, maxWeight]) => ({ date, maxWeight }));

  // --- Precisión de tiro en básquet ---
  type BballRow = {
    shots_made: number | null;
    shots_attempted: number | null;
    workout_sessions: { started_at: string } | { started_at: string }[] | null;
  };
  const shootingSeries = ((bballDetails ?? []) as BballRow[])
    .filter((d) => d.shots_attempted && d.shots_attempted > 0)
    .map((d) => {
      const ws = Array.isArray(d.workout_sessions) ? d.workout_sessions[0] : d.workout_sessions;
      return {
        date: (ws?.started_at ?? "").slice(0, 10),
        accuracy: Math.round(((d.shots_made ?? 0) / (d.shots_attempted ?? 1)) * 100),
      };
    });

  const totalSessions = (sessions ?? []).length;
  const thisWeekStart = startOfWeek(new Date()).toISOString().slice(0, 10);
  const sessionsThisWeek = frequency.find((f) => f.week === thisWeekStart);
  const sessionsThisWeekCount = sessionsThisWeek
    ? sessionsThisWeek.gym + sessionsThisWeek.basketball + sessionsThisWeek.cardio
    : 0;

  const dailyTip = await getOrCreateDailyTip();

  return (
    <DashboardClient
      userName={user?.email?.split("@")[0] ?? "atleta"}
      totalSessions={totalSessions}
      sessionsThisWeek={sessionsThisWeekCount}
      frequency={frequency}
      weightSeries={weightSeries}
      bodyFatSeries={bodyFatSeries}
      topExerciseName={topExerciseName}
      exerciseProgression={exerciseProgression}
      shootingSeries={shootingSeries}
      dailyTip={dailyTip?.tip_text ?? null}
    />
  );
}
