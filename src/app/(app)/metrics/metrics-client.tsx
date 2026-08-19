"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, Ruler, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BodyMetric } from "@/lib/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

function addInterval(dateStr: string, frequency: "weekly" | "monthly") {
  const d = new Date(dateStr + "T00:00:00");
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export default function MetricsClient({
  initialMetrics,
  initialFrequency,
}: {
  initialMetrics: BodyMetric[];
  initialFrequency: "weekly" | "monthly";
}) {
  const supabase = createClient();
  const [metrics, setMetrics] = useState(initialMetrics);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">(initialFrequency);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    weight_kg: "",
    body_fat_pct: "",
    waist_cm: "",
    chest_cm: "",
    arm_cm: "",
    thigh_cm: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const lastMetric = metrics[0] ?? null;
  const nextDueDate = useMemo(
    () => (lastMetric ? addInterval(lastMetric.measured_at, frequency) : null),
    [lastMetric, frequency]
  );
  const isDue = !lastMetric || new Date() >= nextDueDate!;

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function updateFrequency(freq: "weekly" | "monthly") {
    setFrequency(freq);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ measurement_frequency: freq }).eq("id", user.id);
  }

  async function save() {
    setSaving(true);
    setSavedMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        measured_at: todayStr(),
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
        waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
        chest_cm: form.chest_cm ? Number(form.chest_cm) : null,
        arm_cm: form.arm_cm ? Number(form.arm_cm) : null,
        thigh_cm: form.thigh_cm ? Number(form.thigh_cm) : null,
      };

      const { data, error } = await supabase
        .from("body_metrics")
        .upsert(payload, { onConflict: "user_id,measured_at" })
        .select("*")
        .single();

      if (!error && data) {
        setMetrics((prev) => [
          data as BodyMetric,
          ...prev.filter((m) => m.measured_at !== (data as BodyMetric).measured_at),
        ]);
        setSavedMsg("Medidas guardadas");
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold">Medidas corporales</h1>
          <Link
            href="/photos"
            className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 rounded-full px-3 py-1.5"
          >
            <Camera size={13} /> Fotos
          </Link>
        </div>
        <p className="text-sm text-[var(--ink-tertiary)] mb-3">
          Seguimiento de tu cambio físico en el tiempo
        </p>

        <div className="flex gap-2 mb-4">
          {(["weekly", "monthly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => updateFrequency(f)}
              className={`flex-1 rounded-xl py-2.5 text-sm border ${
                frequency === f
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500"
                  : "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border)]"
              }`}
            >
              {f === "weekly" ? "Semanal" : "Mensual"}
            </button>
          ))}
        </div>

        {isDue ? (
          <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 rounded-xl px-4 py-3 mb-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              {lastMetric ? (
                <>
                  <Ruler size={15} /> ¡Toca medición!
                </>
              ) : (
                "Registrá tu primera medición"
              )}
            </p>
            <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
              {lastMetric
                ? `Tu última medición fue el ${lastMetric.measured_at}`
                : "Así podrás ver tu evolución con el tiempo"}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 mb-3">
            <p className="text-sm text-[var(--ink-secondary)] flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              Ya registraste tu medición de este período
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Próxima medición sugerida: {nextDueDate?.toISOString().slice(0, 10)}
            </p>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-xl bg-emerald-500 text-neutral-950 font-semibold py-4 text-base active:scale-[0.98] transition"
          >
            {isDue ? "Registrar medición" : "Registrar de todas formas"}
          </button>
        )}

        {showForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)" value={form.weight_kg} onChange={(v) => setField("weight_kg", v)} />
              <Field label="% Grasa" value={form.body_fat_pct} onChange={(v) => setField("body_fat_pct", v)} />
              <Field label="Cintura (cm)" value={form.waist_cm} onChange={(v) => setField("waist_cm", v)} />
              <Field label="Pecho (cm)" value={form.chest_cm} onChange={(v) => setField("chest_cm", v)} />
              <Field label="Brazo (cm)" value={form.arm_cm} onChange={(v) => setField("arm_cm", v)} />
              <Field label="Muslo (cm)" value={form.thigh_cm} onChange={(v) => setField("thigh_cm", v)} />
            </div>

            {savedMsg && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 rounded-lg px-3 py-2">
                <CheckCircle2 size={15} />
                {savedMsg}
              </p>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-500 text-neutral-950 font-semibold py-4 text-base active:scale-[0.98] transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar medidas"}
            </button>
          </div>
        )}
      </div>

      {metrics.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--ink-tertiary)] mb-2">Historial</h2>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm flex justify-between"
              >
                <span className="text-[var(--ink-tertiary)]">{m.measured_at}</span>
                <span>
                  {m.weight_kg != null && <b>{m.weight_kg} kg</b>}
                  {m.body_fat_pct != null && <> · {m.body_fat_pct}% grasa</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-tertiary)] mb-1">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-3 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}
