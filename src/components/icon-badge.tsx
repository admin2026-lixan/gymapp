import type { LucideIcon } from "lucide-react";

const SIZES = {
  sm: { box: "w-8 h-8 rounded-lg", icon: 15 },
  md: { box: "w-10 h-10 rounded-xl", icon: 19 },
  lg: { box: "w-14 h-14 rounded-2xl", icon: 27 },
} as const;

/**
 * Insignia circular/redondeada con gradiente + icono Lucide centrado.
 * Reemplaza los emoji sueltos por un tratamiento visual consistente en
 * toda la app (fondo con degradé sutil + borde + icono de línea).
 */
export function IconBadge({
  icon: Icon,
  gradient = "from-emerald-500/25 to-emerald-500/5",
  iconClassName = "text-emerald-400",
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  gradient?: string;
  iconClassName?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} border border-[var(--border)] ${s.box} ${className}`}
    >
      <Icon size={s.icon} strokeWidth={2} className={iconClassName} />
    </span>
  );
}
