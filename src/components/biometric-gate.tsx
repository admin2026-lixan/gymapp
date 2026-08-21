"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { Tap } from "@/components/tap";
import {
  isBiometricEnabled,
  isUnlockedThisSession,
  markUnlockedThisSession,
  verifyBiometric,
} from "@/lib/biometric-lock";

/**
 * Candado de pantalla completa que se muestra al abrir la app si el usuario
 * activó el desbloqueo biométrico en Ajustes. No reemplaza la sesión de
 * Supabase (ya activa en este punto) — solo la tapa hasta confirmar huella/
 * Face ID. Queda desbloqueada por el resto de la sesión del navegador/PWA
 * (se vuelve a pedir la próxima vez que se abra la app desde cero).
 */
export default function BiometricGate({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked" | "verifying">(
    "checking"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBiometricEnabled(userId) || isUnlockedThisSession(userId)) {
      setStatus("unlocked");
      return;
    }
    setStatus("locked");
  }, [userId]);

  async function unlock() {
    setStatus("verifying");
    setError(null);
    const ok = await verifyBiometric(userId);
    if (ok) {
      markUnlockedThisSession(userId);
      setStatus("unlocked");
    } else {
      setError("No se pudo verificar. Intentá de nuevo.");
      setStatus("locked");
    }
  }

  const showLock = status === "locked" || status === "verifying";

  return (
    <>
      {children}
      {showLock && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[var(--app-bg)] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Fingerprint size={30} className="text-neutral-950" />
          </div>
          <div>
            <p className="text-base font-semibold">App bloqueada</p>
            <p className="mt-1 text-sm text-[var(--ink-tertiary)]">
              Desbloqueá con tu huella o Face ID para continuar
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Tap
            onClick={unlock}
            disabled={status === "verifying"}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 font-bold py-3.5 px-8 text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {status === "verifying" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Fingerprint size={18} />
            )}
            Desbloquear
          </Tap>
        </div>
      )}
    </>
  );
}
