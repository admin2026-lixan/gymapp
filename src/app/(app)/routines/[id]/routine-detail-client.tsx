"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Check, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MuscleIcon } from "@/lib/muscle-icons";
import { Tap } from "@/components/tap";
import type { Routine } from "@/lib/types";

type RoutineExerciseView = {
  id: string;
  name: string;
  primaryMuscle: string | null;
  targetSets: number | null;
  targetReps: number | null;
};

export default function RoutineDetailClient({
  routine,
  exercises,
  isOwner,
  doneIds,
}: {
  routine: Routine;
  exercises: RoutineExerciseView[];
  isOwner: boolean;
  doneIds: string[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const doneCount = exercises.filter((e) => doneIds.includes(e.id)).length;
  const progress = exercises.length > 0 ? Math.round((doneCount / exercises.length) * 100) : 0;

  async function deleteRoutine() {
    if (!confirm(`¿Eliminar la rutina "${routine.name}"?`)) return;
    await supabase.from("routines").delete().eq("id", routine.id);
    router.push("/routines");
    router.refresh();
  }

  return (
    <div className="space-y-5 pb-4">
      <Link href="/routines" className="flex items-center gap-1 text-sm text-[var(--ink-tertiary)]">
        <ArrowLeft size={14} /> Rutinas
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{routine.name}</h1>
          {routine.description && (
            <p className="text-sm text-[var(--ink-muted)] mt-1">{routine.description}</p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/routines/${routine.id}/edit`}
            className="shrink-0 flex items-center gap-1 text-xs font-medium bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1.5"
          >
            <Pencil size={12} /> Editar
          </Link>
        )}
      </div>

      {exercises.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--ink-muted)]">Progreso de hoy</span>
            <span className="text-xs font-semibold text-emerald-500">
              {doneCount}/{exercises.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exercises.map((ex, i) => {
          const done = doneIds.includes(ex.id);
          return (
            <Link
              key={ex.id}
              href={`/log?exercise=${ex.id}`}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
                done
                  ? "bg-emerald-500/10 border-emerald-800"
                  : "bg-[var(--surface)] border-[var(--border)]"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-semibold shrink-0 ${
                  done ? "bg-emerald-500 text-neutral-950" : "bg-[var(--surface-hover)]"
                }`}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <MuscleIcon muscle={ex.primaryMuscle} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {ex.targetSets ?? "—"} series × {ex.targetReps ?? "—"} reps
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--ink-muted)]" />
            </Link>
          );
        })}
      </div>

      {exercises.length === 0 && (
        <p className="text-sm text-[var(--ink-muted)] text-center py-8">
          Esta rutina todavía no tiene ejercicios
        </p>
      )}

      {isOwner && (
        <Tap
          onClick={deleteRoutine}
          className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-red-500 font-medium py-3 text-sm"
        >
          Eliminar rutina
        </Tap>
      )}
    </div>
  );
}
