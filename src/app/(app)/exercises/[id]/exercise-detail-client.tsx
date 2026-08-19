"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, PlayCircle, ExternalLink } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { MuscleIcon, muscleGradient } from "@/lib/muscle-icons";
import { chartColors } from "@/lib/chart-colors";

type Props = {
  exercise: Exercise;
  progression: { date: string; maxWeight: number; volume: number }[];
  prWeight: number;
  prReps: number;
  totalSets: number;
};

export default function ExerciseDetailClient({
  exercise,
  progression,
  prWeight,
  prReps,
  totalSets,
}: Props) {
  const { resolvedTheme } = useTheme();
  const COLOR = chartColors(resolvedTheme);
  const [showTutorial, setShowTutorial] = useState(false);

  const searchTerm = exercise.video_query || exercise.name;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
  // Embed de resultados de búsqueda de YouTube — no hay un video fijo por
  // ejercicio (a propósito, ver README), así que el tutorial se abre y
  // reproduce ahí mismo en la pantalla, sin salir de la app.
  const embedSrc = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(searchTerm)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 pb-4"
    >
      <Link href="/exercises" className="flex items-center gap-1 text-sm text-[var(--ink-tertiary)]">
        <ArrowLeft size={14} /> Biblioteca
      </Link>

      <div
        className={`rounded-2xl bg-gradient-to-br ${muscleGradient(
          exercise.primary_muscle
        )} bg-[var(--surface)] border border-[var(--border)] px-4 py-4 flex items-center gap-3`}
      >
        <MuscleIcon muscle={exercise.primary_muscle} size="lg" />
        <div>
          <h1 className="text-lg font-semibold">{exercise.name}</h1>
          <p className="text-sm text-[var(--ink-tertiary)] mt-0.5">
            {exercise.primary_muscle}
            {exercise.secondary_muscles ? ` · también trabaja: ${exercise.secondary_muscles}` : ""}
          </p>
        </div>
      </div>

      {exercise.description && (
        <p className="text-sm leading-relaxed text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
          {exercise.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-[var(--ink-tertiary)]">
        {exercise.equipment && (
          <InfoTag label="Equipo" value={exercise.equipment} />
        )}
        {exercise.difficulty && <InfoTag label="Nivel" value={exercise.difficulty} />}
        {exercise.category && (
          <InfoTag label="Tipo" value={exercise.category === "gym" ? "Gym" : "Cardio"} />
        )}
      </div>

      <div>
        <button
          onClick={() => setShowTutorial((v) => !v)}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium py-3 text-sm active:scale-[0.98] transition"
        >
          <PlayCircle size={17} strokeWidth={2.25} />
          {showTutorial ? "Ocultar tutorial" : "Ver tutoriales"}
        </button>

        <AnimatePresence initial={false}>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl overflow-hidden border border-[var(--border)] bg-black aspect-video">
                <iframe
                  key={embedSrc}
                  src={embedSrc}
                  title={`Tutoriales de ${exercise.name}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1 text-xs text-[var(--ink-muted)]"
              >
                Abrir en YouTube <ExternalLink size={11} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {exercise.category === "gym" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="PR peso" value={prWeight ? `${prWeight} kg` : "—"} />
            <StatTile label="PR reps" value={prReps ? `${prReps}` : "—"} />
            <StatTile label="Series totales" value={`${totalSets}`} />
          </div>

          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <h3 className="text-sm font-semibold mb-2">Progresión de carga</h3>
            {progression.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)] py-8 text-center">
                Todavía no registraste series de este ejercicio
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progression}>
                  <CartesianGrid stroke={COLOR.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: COLOR.muted, fontSize: 11 }}
                    axisLine={{ stroke: COLOR.baseline }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: COLOR.muted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: COLOR.surface,
                      border: `1px solid ${COLOR.baseline}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: COLOR.muted }}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    name="Peso máx (kg)"
                    stroke={COLOR.blue}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLOR.blue }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

function InfoTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">{label}</p>
      <p className="text-[var(--ink-secondary)] mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-3 py-3 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">{label}</p>
    </div>
  );
}
