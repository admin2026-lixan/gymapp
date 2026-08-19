import { createClient } from "@/lib/supabase/server";
import RoutinesClient from "./routines-client";
import type { Routine } from "@/lib/types";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(count)")
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order("user_id", { ascending: true, nullsFirst: true })
    .order("name");

  type RoutineRow = Routine & { routine_exercises: { count: number }[] };
  const rows = (routines as RoutineRow[]) ?? [];

  const withCount = rows.map((r) => ({
    ...r,
    exerciseCount: r.routine_exercises?.[0]?.count ?? 0,
  }));

  return <RoutinesClient routines={withCount} />;
}
