import { createBrowserClient } from "@supabase/ssr";
import { createMockBrowserClient } from "./mock-client-browser";
import { isMockMode } from "./mock-shared";

export function createClient() {
  // MODO MOCK: ver src/lib/supabase/mock-shared.ts para cómo desactivarlo.
  if (isMockMode()) {
    return createMockBrowserClient() as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
