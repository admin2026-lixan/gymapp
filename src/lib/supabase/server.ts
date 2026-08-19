import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockServerClient } from "./mock-client-server";
import { isMockMode } from "./mock-shared";

export async function createClient() {
  // MODO MOCK: ver src/lib/supabase/mock-shared.ts para cómo desactivarlo.
  if (isMockMode()) {
    return createMockServerClient() as unknown as ReturnType<typeof createServerClient>;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component; el middleware refresca la sesión.
          }
        },
      },
    }
  );
}
