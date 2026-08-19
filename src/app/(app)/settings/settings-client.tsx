"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconBadge } from "@/components/icon-badge";
import { Tap } from "@/components/tap";
import {
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

export default function SettingsClient() {
  const supabase = createClient();
  const router = useRouter();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (!supported) return;
      const sub = await getCurrentPushSubscription();
      setPushEnabled(Boolean(sub));
    })();
  }, []);

  async function togglePush() {
    setPushError(null);
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "No se pudo activar las notificaciones");
    } finally {
      setPushLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-lg font-semibold">Ajustes</h1>

      <ThemeToggle />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notificaciones push</p>
            <p className="text-xs text-[var(--ink-muted)]">
              Tip diario del asistente y avisos para no perder tu racha
            </p>
          </div>
          {pushSupported ? (
            <button
              onClick={togglePush}
              disabled={pushLoading}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                pushEnabled
                  ? "bg-[var(--surface-hover)] text-[var(--ink-secondary)]"
                  : "bg-emerald-500 text-neutral-950"
              } disabled:opacity-50`}
            >
              {pushLoading ? "..." : pushEnabled ? "Desactivar" : "Activar"}
            </button>
          ) : (
            <span className="text-xs text-[var(--ink-muted)]">No disponible</span>
          )}
        </div>
        {pushError && <p className="text-xs text-red-500 mt-2">{pushError}</p>}
      </div>

      <Link
        href="/photos"
        className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3.5"
      >
        <span className="flex items-center gap-3">
          <IconBadge icon={Camera} gradient="from-violet-500/25 to-violet-500/5" iconClassName="text-violet-400" size="sm" />
          <span className="text-sm font-medium">Fotos de progreso</span>
        </span>
        <ChevronRight size={16} className="text-[var(--ink-muted)]" />
      </Link>

      <Tap
        onClick={signOut}
        className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-red-500 font-medium py-3.5 text-sm"
      >
        Cerrar sesión
      </Tap>
    </div>
  );
}
