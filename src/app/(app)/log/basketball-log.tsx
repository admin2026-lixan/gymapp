"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Wind, Sparkles, Trophy, Zap, MoreHorizontal, CircleDot, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tap } from "@/components/tap";
import { SuccessToast } from "@/components/success-toast";
import { useSuccessToast } from "@/lib/use-success-toast";

const DRILLS: { key: string; icon: LucideIcon }[] = [
  { key: "Tiro", icon: Target },
  { key: "Resistencia", icon: Wind },
  { key: "Técnica", icon: Sparkles },
  { key: "Partido", icon: Trophy },
  { key: "Dribbling", icon: Zap },
  { key: "Otro", icon: MoreHorizontal },
];

export default function BasketballLog() {
  const supabase = createClient();
  const [drill, setDrill] = useState(DRILLS[0].key);
  const [made, setMade] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const toast = useSuccessToast();

  const accuracy = attempted > 0 ? Math.round((made / attempted) * 100) : null;

  async function save() {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({ user_id: user.id, type: "basketball", duration_min: duration })
        .select("*")
        .single();

      if (sessionError || !session) return;

      await supabase.from("basketball_details").insert({
        session_id: session.id,
        user_id: user.id,
        drill_type: drill,
        shots_made: made,
        shots_attempted: attempted,
      });

      toast.trigger("Sesión de básquet guardada");
      setMade(0);
      setAttempted(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SuccessToast show={toast.show} message={toast.message} />

      <div>
        <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1.5">
          Tipo de entrenamiento
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DRILLS.map((d) => {
            const Icon = d.icon;
            return (
              <Tap
                key={d.key}
                onClick={() => setDrill(d.key)}
                className={`rounded-2xl py-3 text-sm border flex flex-col items-center gap-1 ${
                  drill === d.key
                    ? "bg-gradient-to-br from-orange-500 to-orange-400 text-neutral-950 border-orange-500"
                    : "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border)]"
                }`}
              >
                <Icon size={18} strokeWidth={2.25} />
                {d.key}
              </Tap>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Counter label="Anotados" icon={Target} value={made} onChange={setMade} accent="emerald" />
        <Counter label="Intentados" icon={CircleDot} value={attempted} onChange={setAttempted} accent="orange" />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">Duración (min)</label>
        <div className="flex items-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <Tap
            onClick={() => setDuration(Math.max(0, duration - 5))}
            className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
          >
            −
          </Tap>
          <span className="w-full text-center text-lg font-semibold py-3">{duration}</span>
          <Tap
            onClick={() => setDuration(duration + 5)}
            className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
          >
            +
          </Tap>
        </div>
      </div>

      {accuracy !== null && (
        <motion.div
          key={accuracy}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl bg-gradient-to-br from-orange-500/15 to-transparent border border-orange-900/60 px-4 py-3 text-center"
        >
          <p className="text-2xl font-bold text-orange-400 tabular-nums">{accuracy}%</p>
          <p className="text-xs text-[var(--ink-tertiary)]">de acierto</p>
        </motion.div>
      )}

      <Tap
        onClick={save}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-neutral-950 font-bold py-4 text-base shadow-lg shadow-orange-500/20 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar sesión"}
      </Tap>
    </div>
  );
}

function Counter({
  label,
  icon: Icon,
  value,
  onChange,
  accent,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  onChange: (v: number) => void;
  accent: "emerald" | "orange";
}) {
  const textColor = accent === "emerald" ? "text-emerald-400" : "text-orange-400";
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-[var(--ink-tertiary)] mb-1">
        <Icon size={12} /> {label}
      </label>
      <div className="flex items-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <Tap
          onClick={() => onChange(Math.max(0, value - 1))}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          −
        </Tap>
        <span className={`w-full text-center text-lg font-bold py-3 tabular-nums ${textColor}`}>
          {value}
        </span>
        <Tap
          onClick={() => onChange(value + 1)}
          className="px-4 py-3.5 text-xl text-[var(--ink-secondary)] active:bg-[var(--surface-hover)]"
        >
          +
        </Tap>
      </div>
    </div>
  );
}
