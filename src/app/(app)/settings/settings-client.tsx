"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight, Fingerprint } from "lucide-react";
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
import {
  disableBiometric,
  enableBiometric,
  isBiometricEnabled,
  isBiometricSupported,
} from "@/lib/biometric-lock";

export default function SettingsClient() {
  const supabase = createClient();
  const router = useRouter();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (!supported) return;
      const sub = await getCurrentPushSubscription();
      setPushEnabled(Boolean(sub));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      const supported = await isBiometricSupported();
      setBioSupported(supported);
      if (supported) setBioEnabled(isBiometricEnabled(user.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleBiometric() {
    if (!userId) return;
    setBioError(null);
    setBioLoading(true);
    try {
      if (bioEnabled) {
        disableBiometric(userId);
        setBioEnabled(false);
      } else {
        await enableBiometric(userId, userEmail ?? "");
        setBioEnabled(true);
      }
    } catch (err) {
      setBioError(
        err instanceof Error ? err.message : "No se pudo configurar la biometría"
      );
    } finally {
      setBioLoading(false);
    }
  }

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

      {bioSupported && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBadge
                icon={Fingerprint}
                gradient="from-emerald-500/25 to-emerald-500/5"
                iconClassName="text-emerald-400"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Desbloqueo con huella / Face ID</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Pide biometría del celular al abrir la app en este dispositivo
                </p>
              </div>
            </div>
            <button
              onClick={toggleBiometric}
              disabled={bioLoading}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                bioEnabled
                  ? "bg-[var(--surface-hover)] text-[var(--ink-secondary)]"
                  : "bg-emerald-500 text-neutral-950"
              } disabled:opacity-50`}
            >
              {bioLoading ? "..." : bioEnabled ? "Desactivar" : "Activar"}
            </button>
          </div>
          {bioError && <p className="text-xs text-red-500 mt-2">{bioError}</p>}
        </div>
      )}

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
