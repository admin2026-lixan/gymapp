import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "./bottom-nav";
import BiometricGate from "@/components/biometric-gate";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <BiometricGate userId={user.id}>
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--app-bg)]/80 backdrop-blur-xl z-20">
        <span className="font-semibold tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center glow-emerald">
            <Dumbbell size={17} strokeWidth={2.5} className="text-neutral-950" />
          </span>
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
            App Gym
          </span>
        </span>
        <Link
          href="/settings"
          aria-label="Ajustes"
          className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-secondary)]"
        >
          <Settings size={17} strokeWidth={2} />
        </Link>
      </header>

      <main className="flex-1 pb-24 px-4 pt-4 max-w-lg mx-auto w-full">{children}</main>

      <BottomNav />
    </div>
    </BiometricGate>
  );
}
