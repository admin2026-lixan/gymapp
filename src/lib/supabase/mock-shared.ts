/**
 * MODO MOCK — App Gym
 * ===================
 * Este archivo es parte del "modo mock": permite correr la app sin un
 * proyecto Supabase real ni login, para poder navegar toda la UI con datos
 * de prueba. Es TEMPORAL y está pensado para desactivarse con un solo
 * cambio de env var.
 *
 * Para DESACTIVAR el modo mock y usar tu Supabase real:
 *   1. En `.env.local`, poné `NEXT_PUBLIC_MOCK_MODE=false` (o borrá la línea).
 *   2. Completá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY con
 *      los valores reales de tu proyecto Supabase.
 *   3. Reiniciá `npm run dev`.
 *
 * No hace falta revertir ningún código: todos los archivos reales de
 * conexión a Supabase (`client.ts`, `server.ts`, `middleware.ts`) siguen
 * intactos y se usan automáticamente cuando el modo mock está apagado.
 */

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === "true";
}

export const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";

export const FAKE_USER = {
  id: FAKE_USER_ID,
  email: "demo@appgym.local",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "mock" },
  user_metadata: { display_name: "Demo" },
  created_at: new Date().toISOString(),
};
