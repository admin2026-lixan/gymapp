"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { MuscleIcon, muscleIconComponent, muscleGradient } from "@/lib/muscle-icons";

const DIFFICULTY_COLOR: Record<string, string> = {
  principiante: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900",
  intermedio: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900",
  avanzado: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900",
};

export default function ExercisesClient({ exercises }: { exercises: Exercise[] }) {
  const [muscle, setMuscle] = useState<string>("Todos");
  const [query, setQuery] = useState("");

  const muscleGroups = useMemo(() => {
    const set = new Set(exercises.map((e) => e.primary_muscle).filter(Boolean) as string[]);
    return ["Todos", ...Array.from(set).sort()];
  }, [exercises]);

  const filtered = exercises.filter((e) => {
    const matchesMuscle = muscle === "Todos" || e.primary_muscle === muscle;
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    return matchesMuscle && matchesQuery;
  });

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1">Biblioteca de ejercicios</h1>
      <p className="text-sm text-[var(--ink-tertiary)] mb-4">
        Para qué sirve cada ejercicio, qué músculos trabaja y cómo hacerlo bien
      </p>

      <div className="relative mb-3">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] pl-11 pr-4 py-3 text-base outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {muscleGroups.map((m) => {
          const Icon = m !== "Todos" ? muscleIconComponent(m) : null;
          return (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm border ${
                muscle === m
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500"
                  : "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border)]"
              }`}
            >
              {Icon && <Icon size={14} strokeWidth={2.25} />}
              {m}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {filtered.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
          >
            <Link
              href={`/exercises/${ex.id}`}
              className={`block h-full bg-gradient-to-br ${muscleGradient(
                ex.primary_muscle
              )} bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-3.5 py-3.5 active:scale-[0.98] transition`}
            >
              <MuscleIcon muscle={ex.primary_muscle} size="md" />
              <p className="font-medium text-sm mt-2 leading-tight">{ex.name}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-[var(--ink-muted)]">{ex.primary_muscle}</p>
                {ex.difficulty && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${DIFFICULTY_COLOR[ex.difficulty]}`}
                  >
                    {ex.difficulty.slice(0, 3)}
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-sm text-[var(--ink-muted)] text-center py-8">
            No encontramos ejercicios con ese filtro
          </p>
        )}
      </div>
    </div>
  );
}
