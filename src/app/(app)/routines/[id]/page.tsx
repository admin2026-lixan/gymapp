import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoutineDetailClient from "./routine-detail-client";
import type { Routine } from "@/lib/types";

export default async function RoutineDetailPage({ params }: PageProps<"/routines/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: routine }, { data: items }] = await Promise.all([
    supabase.from("routines").select("*").eq("id", id).single(),
    supabase
      .from("routine_exercises")
      .select("*, exercises(id, name, primary_muscle, category)")
      .eq("routine_id", id)
      .order("order_index"),
  ]);

  if (!routine) notFound();

  type ItemRow = {
    id: string;
    target_sets: number | null;
    target_reps: number | null;
    order_index: number;
    exercises: { id: string; name: string; primary_muscle: string | null; category: string } | null;
  };

  const exercises = ((items as ItemRow[]) ?? [])
    .filter((it) => it.exercises)
    .map((it) => ({
      id: it.exercises!.id,
      name: it.exercises!.name,
      primaryMuscle: it.exercises!.primary_muscle,
      targetSets: it.target_sets,
      targetReps: it.target_reps,
    }));

  const isOwner = (routine as Routine).user_id === user?.id;

  let doneIds: string[] = [];
  if (exercises.length > 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: todaySets } = await supabase
      .from("exercise_sets")
      .select("exercise_id")
      .in(
        "exercise_id",
        exercises.map((e) => e.id)
      )
      .gte("created_at", startOfDay.toISOString());
    doneIds = Array.from(new Set((todaySets ?? []).map((s) => s.exercise_id)));
  }

  return (
    <RoutineDetailClient
      routine={routine as Routine}
      exercises={exercises}
      isOwner={isOwner}
      doneIds={doneIds}
    />
  );
}
