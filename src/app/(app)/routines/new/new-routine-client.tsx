"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MuscleIcon } from "@/lib/muscle-icons";
import { Tap } from "@/components/tap";
import ExercisePicker from "@/components/exercise-picker";
import type { Exercise } from "@/lib/types";

type Item = { exerciseId: string; name: string; primaryMuscle: string | null; sets: number; reps: number };

export default function NewRoutineClient({ exercises }: { exercises: Exercise[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(id: string) {
    const ex = exercises.find((e) => e.id === id);
    if (!ex || items.some((i) => i.exerciseId === id)) {
      setPickerOpen(false);
      return;
    }
    setItems((prev) => [
      ...prev,
      { exerciseId: id, name: ex.name, primaryMuscle: ex.primary_muscle, sets: 3, reps: 10 },
    ]);
    setPickerOpen(false);
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.exerciseId === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.exerciseId !== id));
  }

  async function save() {
    if (!name.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: routine, error } = await supabase
        .from("routines")
        .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null })
        .select("*")
        .single();
      if (error || !routine) return;

      const rows = items.map((item, index) => ({
        routine_id: routine.id,
        exercise_id: item.exerciseId,
        order_index: index,
        target_sets: item.sets,
        target_reps: item.reps,
      }));
      await supabase.from("routine_exercises").insert(rows);

      router.push(`/routines/${routine.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <ExercisePicker
        open={pickerOpen}
        exercises={exercises.filter((e) => e.category === "gym")}
        recentIds={[]}
        onSelect={addExercise}
        onClose={() => setPickerOpen(false)}
      />

      <h1 className="text-lg font-semibold">Nueva rutina</h1>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la rutina (ej: Día de piernas)"
          className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-emerald-500"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.exerciseId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <MuscleIcon muscle={item.primaryMuscle} size="sm" />
                <p className="text-sm font-medium flex-1 truncate">
                  {i + 1}. {item.name}
                </p>
                <button
                  onClick={() => removeItem(item.exerciseId)}
                  className="text-[var(--ink-muted)] px-1"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MiniStepper
                  value={item.sets}
                  onChange={(v) => updateItem(item.exerciseId, { sets: v })}
                  suffix="series"
                />
                <MiniStepper
                  value={item.reps}
                  onChange={(v) => updateItem(item.exerciseId, { reps: v })}
                  suffix="reps"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Tap
        onClick={() => setPickerOpen(true)}
        className="w-full rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border-strong)] text-[var(--ink-secondary)] font-medium py-3.5 text-sm"
      >
        + Agregar ejercicio
      </Tap>

      <Tap
        onClick={save}
        disabled={saving || !name.trim() || items.length === 0}
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-neutral-950 font-bold py-4 text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar rutina"}
      </Tap>
    </div>
  );
}

function MiniStepper({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-hover)] px-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="px-2 py-1.5 text-base">
        −
      </button>
      <span className="w-14 text-center tabular-nums">
        {value} <span className="text-[var(--ink-muted)] text-xs">{suffix}</span>
      </span>
      <button onClick={() => onChange(value + 1)} className="px-2 py-1.5 text-base">
        +
      </button>
    </div>
  );
}
