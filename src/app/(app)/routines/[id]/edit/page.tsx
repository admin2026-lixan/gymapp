import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditRoutineClient from "./edit-routine-client";
import type { Exercise, Routine } from "@/lib/types";

export default async function EditRoutinePage({ params }: PageProps<"/routines/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: routine }, { data: items }, { data: exercises }] = await Promise.all([
    supabase.from("routines").select("*").eq("id", id).single(),
    supabase
      .from("routine_exercises")
      .select("id, exercise_id, target_sets, target_reps, order_index, exercises(id, name, primary_muscle)")
      .eq("routine_id", id)
      .order("order_index"),
    supabase
      .from("exercises")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user?.id}`)
      .order("name"),
  ]);

  if (!routine) notFound();
  // Solo el dueño puede editar; las plantillas globales (user_id null) no se editan acá.
  if ((routine as Routine).user_id !== user?.id) redirect(`/routines/${id}`);

  type ItemRow = {
    exercise_id: string;
    target_sets: number | null;
    target_reps: number | null;
    exercises: { id: string; name: string; primary_muscle: string | null } | { id: string; name: string; primary_muscle: string | null }[] | null;
  };

  const initialItems = ((items as ItemRow[]) ?? [])
    .map((it) => {
      const ex = Array.isArray(it.exercises) ? it.exercises[0] : it.exercises;
      if (!ex) return null;
      return {
        exerciseId: it.exercise_id,
        name: ex.name,
        primaryMuscle: ex.primary_muscle,
        sets: it.target_sets ?? 3,
        reps: it.target_reps ?? 10,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <EditRoutineClient
      routine={routine as Routine}
      initialItems={initialItems}
      exercises={(exercises as Exercise[]) ?? []}
    />
  );
}
