import { createClient } from "@/lib/supabase/server";
import MetricsClient from "./metrics-client";
import type { BodyMetric, Profile } from "@/lib/types";

export default async function MetricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: metrics }, { data: profile }] = await Promise.all([
    supabase.from("body_metrics").select("*").order("measured_at", { ascending: false }).limit(30),
    supabase
      .from("profiles")
      .select("id, display_name, height_cm, measurement_frequency")
      .eq("id", user?.id ?? "")
      .single(),
  ]);

  return (
    <MetricsClient
      initialMetrics={(metrics as BodyMetric[]) ?? []}
      initialFrequency={(profile as Profile | null)?.measurement_frequency ?? "weekly"}
    />
  );
}
