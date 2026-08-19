import { createClient } from "@/lib/supabase/server";
import ExercisesClient from "./exercises-client";
import type { Exercise } from "@/lib/types";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order("primary_muscle")
    .order("name");

  return <ExercisesClient exercises={(data as Exercise[]) ?? []} />;
}
