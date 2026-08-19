"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat2, X, Info, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateTodaySession } from "@/lib/session";
import { MuscleIcon, muscleGradient } from "@/lib/muscle-icons";
import { Tap } from "@/components/tap";
import { SuccessToast } from "@/components/success-toast";
import { useSuccessToast } from "@/lib/use-success-toast";
import type { Exercise, ExerciseSet } from "@/lib/types";
import ExercisePicker from "@/components/exercise-picker";

const RECENTS_KEY = "app-gym:recent-exercises";

function pushRecent(id: string) {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, 6);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export default function GymLog({ exercises }: { exercises: Exercise[] }) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("exercise");
  const [exerciseId, setExerciseId] = useState(
    (preselected && exercises.some((e) => e.id === preselected) ? preselected : exercises[0]?.id) ?? ""
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [weight, setWeight] = useState<number>(20);
  const [reps, setReps] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [todaySets, setTodaySets] = useState<ExerciseSet[]>([]);
  const [lastWeightForExercise, setLastWeightForExercise] = useState<number | null>(null);
  const toast = useSuccessToast();

  const exercise = exercises.find((e) => e.id === exerciseId);

  useEffect(() => {
    // Lectura síncrona de localStorage al montar (no de un recurso externo
    // asíncrono), es el patrón recomendado para hidratar estado del cliente.
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setRecentIds(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const loadTodaySets = useCallback(
    async (exId: string) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("exercise_sets")
        .select("*")
        .eq("exercise_id", exId)
        .gte("created_at", startOfDay.toISOString())
        .order("set_number", { ascending: true });
      setTodaySets((data as ExerciseSet[]) ?? []);
    },
    [supabase]
  );

  const loadLastWeight = useCallback(
    async (exId: string) => {
      const { data } = await supabase
        .from("exercise_sets")
        .select("weight_kg, reps, created_at")
        .eq("exercise_id", exId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastWeightForExercise(data?.weight_kg ?? null);
      if (data?.weight_kg != null) setWeight(data.weight_kg);
      if (data?.reps != null) setReps(data.reps);
    },
    [supabase]
  );

  useEffect(() => {
    if (!exerciseId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTodaySets(exerciseId);
    loadLastWeight(exerciseId);
  }, [exerciseId, loadTodaySets, loadLastWeight]);

  function selectExercise(id: string) {
    setExerciseId(id);
    setPickerOpen(false);
    setRecentIds(pushRecent(id));
  }

  async function addSet(customWeight?: number, customReps?: number) {
    if (!exerciseId) return;
    setSaving(true);
    try {
      const session = await getOrCreateTodaySession("gym");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const setNumber = todaySets.length + 1;
      const w = customWeight ?? weight;
      const r = customReps ?? reps;

      const { error } = await supabase.from("exercise_sets").insert({
        session_id: session.id,
        user_id: user!.id,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight_kg: w,
        reps: r,
      });

      if (!error) {
        await loadTodaySets(exerciseId);
        toast.trigger(`Serie ${setNumber} guardada`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeSet(id: string) {
    await supabase.from("exercise_sets").delete().eq("id", id);
    loadTodaySets(exerciseId);
  }

  const lastSet = todaySets[todaySets.length - 1];

  return (
    <div className="space-y-4">
      <ExercisePicker
        open={pickerOpen}
        exercises={exercises}
        recentIds={recentIds}
        onSelect={selectExercise}
        onClose={() => setPickerOpen(false)}
      />
      <SuccessToast show={toast.show} message={toast.message} />

      {/* Selector de ejercicio: tarjeta grande y visual, no un <select> perdido */}
      <button
        onClick={() => setPickerOpen(true)}
        className={`w-full text-left rounded-2xl border border-[var(--border)] bg-gradient-to-br ${muscleGradient(
          exercise?.primary_muscle
        )} bg-[var(--surface)] px-4 py-4 flex items-center gap-3 active:scale-[0.99] transition`}
      >
        <MuscleIcon muscle={exercise?.primary_muscle} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{exercise?.name ?? "Elegí un ejercicio"}</p>
          <p className="text-xs text-[var(--ink-tertiary)]">
            {exercise?.primary_muscle ?? "Tocá para buscar"}
            {lastWeightForExercise !== null && ` · último: ${lastWeightForExercise} kg`}
          </p>
        </div>
        <ChevronDown size={16} className="text-[var(--ink-muted)]" />
      </button>

      {exercise && (
        <Link
          href={`/exercises/${exercise.id}`}
          className="inline-flex items-center gap-1 text-xs text-emerald-400"
        >
          <Info size={13} /> Ver técnica, tutorial y progreso
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stepper label="Peso (kg)" value={weight} onChange={setWeight} step={2.5} accent="emerald" />
        <Stepper label="Repeticiones" value={reps} onChange={setReps} step={1} accent="blue" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Tap
          onClick={() => addSet()}
          disabled={saving || !exerciseId}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 font-bold py-4 text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {saving ? "Guardando..." : `+ Agregar serie ${todaySets.length + 1}`}
        </Tap>

        {lastSet && (
          <Tap
            onClick={() => addSet(lastSet.weight_kg ?? weight, lastSet.reps ?? reps)}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-secondary)] font-medium py-3 text-sm disabled:opacity-50"
          >
            <Repeat2 size={15} />
            Repetir última serie ({lastSet.weight_kg} kg × {lastSet.reps})
          </Tap>
        )}
      </div>

      {todaySets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--ink-tertiary)] mb-2">Series de hoy</h3>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {todaySets.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 overflow-hidden"
                >
                  <span className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs flex items-center justify-center font-semibold">
                      {s.set_number}
                    </span>
                    <b>{s.weight_kg} kg</b> × {s.reps} reps
                  </span>
                  <button
                    onClick={() => removeSet(s.id)}
                    className="text-[var(--ink-muted)] px-2"
                    aria-label="Eliminar serie"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  accent: "emerald" | "blue";
}) {
  const ring = accent === "emerald" ? "focus-within:border-emerald-500" : "focus-within:border-blue-500";
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">{label}</label>
      <div
        className={`flex items-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden ${ring}`}
      >
        <Tap
          onClick={() => onChange(Math.max(0, value - step))}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          −
        </Tap>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full text-center bg-transparent outline-none text-lg font-semibold py-3"
        />
        <Tap
          onClick={() => onChange(value + step)}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          +
        </Tap>
      </div>
    </div>
  );
}
