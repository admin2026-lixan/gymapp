import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExerciseDetailClient from "./exercise-detail-client";
import type { Exercise } from "@/lib/types";

export default async function ExerciseDetailPage({ params }: PageProps<"/exercises/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();

  if (!exercise) notFound();

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("weight_kg, reps, set_number, created_at")
    .eq("exercise_id", id)
    .order("created_at", { ascending: true });

  type SetRow = { weight_kg: number | null; reps: number | null; set_number: number; created_at: string };
  const rows = (sets ?? []) as SetRow[];

  // Volumen y peso máximo por día
  const byDay = new Map<string, { maxWeight: number; volume: number }>();
  for (const s of rows) {
    const day = s.created_at.slice(0, 10);
    const weight = s.weight_kg ?? 0;
    const reps = s.reps ?? 0;
    const cur = byDay.get(day) ?? { maxWeight: 0, volume: 0 };
    cur.maxWeight = Math.max(cur.maxWeight, weight);
    cur.volume += weight * reps;
    byDay.set(day, cur);
  }
  const progression = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, maxWeight: v.maxWeight, volume: Math.round(v.volume) }));

  const prWeight = rows.reduce((max, s) => Math.max(max, s.weight_kg ?? 0), 0);
  const prReps = rows.reduce((max, s) => Math.max(max, s.reps ?? 0), 0);
  const totalSets = rows.length;

  return (
    <ExerciseDetailClient
      exercise={exercise as Exercise}
      progression={progression}
      prWeight={prWeight}
      prReps={prReps}
      totalSets={totalSets}
    />
  );
}
