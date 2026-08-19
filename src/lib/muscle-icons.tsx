// Mapeo de grupo muscular -> ícono Lucide + gradiente + color, para darle
// identidad visual a cada tarjeta sin depender de imágenes externas ni emoji.

import {
  HeartPulse,
  Shield,
  Footprints,
  PersonStanding,
  Dumbbell,
  Flame,
  Waves,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { IconBadge } from "@/components/icon-badge";

export const MUSCLE_ICON: Record<string, LucideIcon> = {
  Pecho: HeartPulse,
  Espalda: Shield,
  Piernas: Footprints,
  Hombros: PersonStanding,
  Brazos: Dumbbell,
  Core: Flame,
  Glúteos: Waves,
  Cardio: Activity,
};

export const MUSCLE_GRADIENT: Record<string, string> = {
  Pecho: "from-rose-500/20 to-rose-500/0",
  Espalda: "from-blue-500/20 to-blue-500/0",
  Piernas: "from-emerald-500/20 to-emerald-500/0",
  Hombros: "from-amber-500/20 to-amber-500/0",
  Brazos: "from-violet-500/20 to-violet-500/0",
  Core: "from-orange-500/20 to-orange-500/0",
  Glúteos: "from-pink-500/20 to-pink-500/0",
  Cardio: "from-cyan-500/20 to-cyan-500/0",
};

export const MUSCLE_TEXT: Record<string, string> = {
  Pecho: "text-rose-400",
  Espalda: "text-blue-400",
  Piernas: "text-emerald-400",
  Hombros: "text-amber-400",
  Brazos: "text-violet-400",
  Core: "text-orange-400",
  Glúteos: "text-pink-400",
  Cardio: "text-cyan-400",
};

export function muscleIconComponent(muscle: string | null | undefined): LucideIcon {
  if (!muscle) return Dumbbell;
  return MUSCLE_ICON[muscle] ?? Dumbbell;
}

export function muscleGradient(muscle: string | null | undefined): string {
  if (!muscle) return "from-neutral-500/20 to-neutral-500/0";
  return MUSCLE_GRADIENT[muscle] ?? "from-neutral-500/20 to-neutral-500/0";
}

export function muscleTextColor(muscle: string | null | undefined): string {
  if (!muscle) return "text-[var(--ink-tertiary)]";
  return MUSCLE_TEXT[muscle] ?? "text-[var(--ink-tertiary)]";
}

/** Insignia lista para usar: ícono del grupo muscular sobre su gradiente de marca. */
export function MuscleIcon({
  muscle,
  size = "md",
  className,
}: {
  muscle: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <IconBadge
      icon={muscleIconComponent(muscle)}
      gradient={muscleGradient(muscle)}
      iconClassName={muscleTextColor(muscle)}
      size={size}
      className={className}
    />
  );
}
