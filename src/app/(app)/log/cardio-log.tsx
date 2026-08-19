"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tap } from "@/components/tap";
import { SuccessToast } from "@/components/success-toast";
import { useSuccessToast } from "@/lib/use-success-toast";

const PRESETS = [10, 20, 30, 45, 60];

export default function CardioLog() {
  const supabase = createClient();
  const [duration, setDuration] = useState(20);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useSuccessToast();

  async function save() {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("workout_sessions").insert({
        user_id: user.id,
        type: "cardio",
        duration_min: duration,
        notes: notes || null,
      });

      toast.trigger("Sesión de cardio guardada");
      setNotes("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SuccessToast show={toast.show} message={toast.message} />

      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 to-transparent border border-cyan-900/60 px-4 py-5 text-center">
        <p className="text-4xl font-bold text-cyan-300 tabular-nums">{duration}</p>
        <p className="text-xs text-[var(--ink-tertiary)]">minutos</p>
      </div>

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <Tap
            key={p}
            onClick={() => setDuration(p)}
            className={`flex-1 rounded-xl py-2.5 text-sm border ${
              duration === p
                ? "bg-cyan-500 text-neutral-950 border-cyan-500"
                : "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border)]"
            }`}
          >
            {p}′
          </Tap>
        ))}
      </div>

      <div className="flex items-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <Tap
          onClick={() => setDuration(Math.max(0, duration - 5))}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          −
        </Tap>
        <span className="w-full text-center text-base py-3 text-[var(--ink-tertiary)]">ajuste fino</span>
        <Tap
          onClick={() => setDuration(duration + 5)}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          +
        </Tap>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ej: trote 5km, bici estática, saltar cuerda..."
          className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-cyan-500"
        />
      </div>

      <Tap
        onClick={save}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-neutral-950 font-bold py-4 text-base shadow-lg shadow-cyan-500/20 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar sesión"}
      </Tap>
    </div>
  );
}
