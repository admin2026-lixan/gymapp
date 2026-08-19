import { createClient } from "@/lib/supabase/server";
import NewRoutineClient from "./new-routine-client";
import type { Exercise } from "@/lib/types";

export default async function NewRoutinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order("name");

  return <NewRoutineClient exercises={(exercises as Exercise[]) ?? []} />;
}
