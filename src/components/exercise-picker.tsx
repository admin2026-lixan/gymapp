"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { MuscleIcon } from "@/lib/muscle-icons";

export default function ExercisePicker({
  open,
  exercises,
  recentIds,
  onSelect,
  onClose,
}: {
  open: boolean;
  exercises: Exercise[];
  recentIds: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Todos");

  const muscleGroups = useMemo(() => {
    const set = new Set(exercises.map((e) => e.primary_muscle).filter(Boolean) as string[]);
    return ["Todos", ...Array.from(set).sort()];
  }, [exercises]);

  const recentExercises = useMemo(
    () =>
      recentIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter((e): e is Exercise => Boolean(e)),
    [recentIds, exercises]
  );

  const filtered = exercises.filter((e) => {
    const matchesMuscle = muscle === "Todos" || e.primary_muscle === muscle;
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    return matchesMuscle && matchesQuery;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-[var(--app-bg)] border-t border-[var(--border)] flex flex-col"
          >
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-[var(--border-strong)]" />

            <div className="px-4 pt-3 pb-2">
              <h2 className="text-base font-semibold mb-3">Elegí un ejercicio</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] pl-10 pr-4 py-3 text-base outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {recentExercises.length > 0 && !query && muscle === "Todos" && (
              <div className="px-4 pb-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">
                  Recientes
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                  {recentExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex.id)}
                      className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-800 text-emerald-300 pl-1.5 pr-3.5 py-1.5 text-sm"
                    >
                      <MuscleIcon muscle={ex.primary_muscle} size="sm" />
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 px-4 -mx-0">
              {muscleGroups.map((m) => (
                <button
                  key={m}
                  onClick={() => setMuscle(m)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm border ${
                    muscle === m
                      ? "bg-emerald-500 text-neutral-950 border-emerald-500"
                      : "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-8 space-y-1.5">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex.id)}
                  className="w-full flex items-center gap-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3.5 py-3 text-left active:bg-[var(--surface-hover)]"
                >
                  <MuscleIcon muscle={ex.primary_muscle} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{ex.primary_muscle}</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-[var(--ink-muted)] text-center py-8">Sin resultados</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
