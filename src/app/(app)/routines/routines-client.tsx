"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Routine } from "@/lib/types";

type RoutineWithCount = Routine & { exerciseCount: number };

export default function RoutinesClient({ routines }: { routines: RoutineWithCount[] }) {
  const templates = routines.filter((r) => r.user_id === null);
  const mine = routines.filter((r) => r.user_id !== null);

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Rutinas</h1>
          <p className="text-sm text-[var(--ink-muted)]">Planes de entrenamiento listos para usar</p>
        </div>
        <Link
          href="/routines/new"
          className="text-sm font-semibold bg-emerald-500 text-neutral-950 rounded-full px-3.5 py-2"
        >
          + Nueva
        </Link>
      </div>

      {mine.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wide text-[var(--ink-muted)] mb-2">Mis rutinas</h2>
          <div className="space-y-2">
            {mine.map((r, i) => (
              <RoutineCard key={r.id} routine={r} index={i} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs uppercase tracking-wide text-[var(--ink-muted)] mb-2">Plantillas</h2>
        <div className="space-y-2">
          {templates.map((r, i) => (
            <RoutineCard key={r.id} routine={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoutineCard({ routine, index }: { routine: RoutineWithCount; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 6) * 0.03 }}
    >
      <Link
        href={`/routines/${routine.id}`}
        className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3.5 active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">{routine.name}</p>
          <span className="text-xs text-[var(--ink-muted)]">{routine.exerciseCount} ejercicios</span>
        </div>
        {routine.description && (
          <p className="text-xs text-[var(--ink-tertiary)] mt-1">{routine.description}</p>
        )}
      </Link>
    </motion.div>
  );
}
