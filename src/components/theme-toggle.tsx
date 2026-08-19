"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita mismatch de hidratación: el tema real solo se conoce en el cliente.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";

  return (
    <div className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3">
      <div>
        <p className="text-sm font-medium">Apariencia</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {!mounted ? "Cargando..." : isLight ? "Modo claro" : "Modo oscuro"}
        </p>
      </div>
      <button
        onClick={() => setTheme(isLight ? "dark" : "light")}
        aria-label="Cambiar tema"
        className="relative w-16 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center px-1"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow"
          style={{ marginLeft: isLight ? "auto" : 0 }}
        >
          {isLight ? (
            <Sun size={14} strokeWidth={2.5} className="text-neutral-950" />
          ) : (
            <Moon size={14} strokeWidth={2.5} className="text-neutral-950" />
          )}
        </motion.div>
      </button>
    </div>
  );
}
