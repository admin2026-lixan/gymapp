import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la Service Role Key — ignora RLS. Úsese SOLO en rutas de
 * servidor de confianza (cron jobs) que necesitan leer/escribir datos de
 * TODOS los usuarios, nunca en código que responde directamente a una
 * request de un usuario específico.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
