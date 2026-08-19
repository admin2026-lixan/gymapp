import { createClient } from "@/lib/supabase/client";
import type { WorkoutSession } from "@/lib/types";

/**
 * Devuelve la sesión de hoy para el tipo dado, o crea una nueva si no existe.
 * Esto permite que "Agregar serie" funcione sin que el usuario tenga que
 * abrir/cerrar sesiones manualmente mientras entrena.
 */
export async function getOrCreateTodaySession(
  type: WorkoutSession["type"]
): Promise<WorkoutSession> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No hay usuario autenticado");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", type)
    .gte("started_at", startOfDay.toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as WorkoutSession;

  const { data: created, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: user.id, type })
    .select("*")
    .single();

  if (error) throw error;
  return created as WorkoutSession;
}
