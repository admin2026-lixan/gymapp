import { createClient } from "@/lib/supabase/server";
import LogClient from "./log-client";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order("name");

  return <LogClient initialExercises={exercises ?? []} />;
}
