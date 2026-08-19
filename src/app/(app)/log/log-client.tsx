"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, CircleDot, Activity, type LucideIcon } from "lucide-react";
import type { Exercise } from "@/lib/types";
import GymLog from "./gym-log";
import BasketballLog from "./basketball-log";
import CardioLog from "./cardio-log";

const TABS: { key: "gym" | "basketball" | "cardio"; label: string; icon: LucideIcon }[] = [
  { key: "gym", label: "Gym", icon: Dumbbell },
  { key: "basketball", label: "Básquet", icon: CircleDot },
  { key: "cardio", label: "Cardio", icon: Activity },
];

type TabKey = (typeof TABS)[number]["key"];

export default function LogClient({ initialExercises }: { initialExercises: Exercise[] }) {
  const [tab, setTab] = useState<TabKey>("gym");

  return (
    <div>
      <div className="relative grid grid-cols-3 gap-1 mb-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative z-10 rounded-xl py-2.5 text-sm font-medium"
            >
              {tab === t.key && (
                <motion.div
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 -z-10"
                />
              )}
              <span
                className={`inline-flex items-center gap-1.5 ${
                  tab === t.key ? "text-neutral-950" : "text-[var(--ink-secondary)]"
                }`}
              >
                <Icon size={15} strokeWidth={2.25} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {tab === "gym" && <GymLog exercises={initialExercises.filter((e) => e.category === "gym")} />}
        {tab === "basketball" && <BasketballLog />}
        {tab === "cardio" && <CardioLog />}
      </motion.div>
    </div>
  );
}
