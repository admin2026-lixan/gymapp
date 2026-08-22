"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tap } from "@/components/tap";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.5 5.4C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // Si no hubo error, el navegador ya está siendo redirigido a Google.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Cuenta creada. Revisa tu correo para confirmar (si aplica) e inicia sesión.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.7, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <Dumbbell size={28} strokeWidth={2.25} className="text-neutral-950" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
            App Gym
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-tertiary)]">
            Tu progreso de gym, básquet y físico en un solo lugar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-emerald-500 transition-colors"
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-700 dark:text-red-400 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-xl px-3 py-2 overflow-hidden"
              >
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 rounded-xl px-3 py-2 overflow-hidden"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <Tap
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 font-bold py-3.5 text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "Cargando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
          </Tap>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-sm text-[var(--ink-tertiary)]"
        >
          {mode === "signin" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--ink-muted)]">o</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <Tap
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] py-3.5 text-sm font-medium disabled:opacity-50"
        >
          <GoogleIcon />
          {googleLoading ? "Redirigiendo a Google..." : "Continuar con Google"}
        </Tap>
        <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">
          Tu cuenta queda vinculada de forma segura a través de Google — sin contraseñas nuevas que recordar.
        </p>
      </motion.div>
    </div>
  );
}
