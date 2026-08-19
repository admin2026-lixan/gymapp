"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Bot,
  Flame,
  CalendarDays,
  BarChart3,
  Scale,
  Percent,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  type LucideIcon,
} from "lucide-react";
import { CountUp } from "@/components/count-up";
import { IconBadge } from "@/components/icon-badge";
import { chartColors } from "@/lib/chart-colors";

type Props = {
  userName: string;
  totalSessions: number;
  sessionsThisWeek: number;
  frequency: { week: string; gym: number; basketball: number; cardio: number }[];
  weightSeries: { date: string; weight: number }[];
  bodyFatSeries: { date: string; fat: number }[];
  topExerciseName: string | null;
  exerciseProgression: { date: string; maxWeight: number }[];
  shootingSeries: { date: string; accuracy: number }[];
  dailyTip: string | null;
};

export default function DashboardClient({
  userName,
  totalSessions,
  sessionsThisWeek,
  frequency,
  weightSeries,
  bodyFatSeries,
  topExerciseName,
  exerciseProgression,
  shootingSeries,
  dailyTip,
}: Props) {
  const { resolvedTheme } = useTheme();
  const COLOR = chartColors(resolvedTheme);

  // Totales semanales (para el sparkline + delta de las tarjetas de arriba).
  const weeklyTotals = useMemo(
    () => frequency.map((f) => ({ week: f.week, total: f.gym + f.basketball + f.cardio })),
    [frequency]
  );
  const weeklyDelta = useMemo(() => {
    if (weeklyTotals.length < 2) return null;
    return sessionsThisWeek - weeklyTotals[weeklyTotals.length - 2].total;
  }, [weeklyTotals, sessionsThisWeek]);
  const cumulativeTotals = useMemo(
    () =>
      weeklyTotals.reduce<{ week: string; total: number }[]>((acc, w) => {
        const prevTotal = acc.length > 0 ? acc[acc.length - 1].total : 0;
        acc.push({ week: w.week, total: prevTotal + w.total });
        return acc;
      }, []),
    [weeklyTotals]
  );

  return (
    <div className="space-y-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-semibold bg-gradient-to-r from-[var(--ink)] to-[var(--ink-tertiary)] bg-clip-text text-transparent">
          Hola, {userName}
        </h1>
        <p className="text-sm text-[var(--ink-tertiary)]">Este es tu progreso reciente</p>
      </motion.div>

      {dailyTip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-[var(--surface)] to-[var(--surface)] border border-emerald-200 dark:from-emerald-950/70 dark:via-[var(--surface)] dark:to-[var(--surface)] dark:border-emerald-900/60 px-4 py-3.5"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <IconBadge
              icon={Bot}
              gradient="from-emerald-400/30 to-cyan-500/10"
              iconClassName="text-emerald-400"
              size="sm"
            />
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-1">Tip de hoy</p>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{dailyTip}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={Flame}
          gradient="from-orange-500/25 to-orange-500/5"
          iconClassName="text-orange-400"
          label="Sesiones esta semana"
          value={sessionsThisWeek}
          delta={weeklyDelta}
          trend={weeklyTotals}
          trendColor={COLOR.orange}
        />
        <StatTile
          icon={CalendarDays}
          gradient="from-cyan-500/25 to-cyan-500/5"
          iconClassName="text-cyan-400"
          label="Sesiones (12 semanas)"
          value={totalSessions}
          trend={cumulativeTotals}
          trendColor={COLOR.aqua}
        />
      </div>

      <ChartCard icon={BarChart3} iconColor="text-blue-400" title="Frecuencia de entrenamiento" subtitle="Sesiones por semana, por tipo">
        {frequency.length === 0 ? (
          <EmptyState text="Registra tu primer entrenamiento para ver esta gráfica" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={frequency} barGap={2} barCategoryGap={14}>
              <CartesianGrid stroke={COLOR.grid} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: COLOR.muted, fontSize: 11 }}
                axisLine={{ stroke: COLOR.baseline }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: COLOR.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: COLOR.textSecondary, paddingTop: 6 }}
                formatter={(v: string) =>
                  v === "gym" ? "Gym" : v === "basketball" ? "Básquet" : "Cardio"
                }
              />
              <Bar dataKey="gym" stackId="s" fill={COLOR.blue} stroke={COLOR.surface} strokeWidth={2} maxBarSize={24} />
              <Bar dataKey="basketball" stackId="s" fill={COLOR.orange} stroke={COLOR.surface} strokeWidth={2} maxBarSize={24} />
              <Bar
                dataKey="cardio"
                stackId="s"
                fill={COLOR.aqua}
                stroke={COLOR.surface}
                strokeWidth={2}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={Scale} iconColor="text-blue-400" title="Peso corporal" subtitle="Evolución en el tiempo">
        {weightSeries.length === 0 ? (
          <EmptyState text="Registra tus medidas para ver tu evolución de peso" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weightSeries}>
              <defs>
                <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.blue} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLOR.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                domain={["auto", "auto"]}
                width={32}
              />
              <Tooltip content={<ChartTooltip unit=" kg" />} cursor={{ stroke: COLOR.baseline, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke={COLOR.blue}
                strokeWidth={2}
                fill="url(#fillWeight)"
                dot={{ r: 3, fill: COLOR.blue, stroke: COLOR.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: COLOR.blue, stroke: COLOR.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {bodyFatSeries.length > 0 && (
        <ChartCard icon={Percent} iconColor="text-orange-400" title="% de grasa corporal" subtitle="Evolución en el tiempo">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bodyFatSeries}>
              <defs>
                <linearGradient id="fillFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.orange} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLOR.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
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
              />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: COLOR.baseline, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="fat"
                stroke={COLOR.orange}
                strokeWidth={2}
                fill="url(#fillFat)"
                dot={{ r: 3, fill: COLOR.orange, stroke: COLOR.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: COLOR.orange, stroke: COLOR.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard
        icon={TrendingUp}
        iconColor="text-emerald-400"
        title="Progresión de fuerza"
        subtitle={topExerciseName ? `Peso máximo — ${topExerciseName}` : "Peso máximo por sesión"}
      >
        {exerciseProgression.length === 0 ? (
          <EmptyState text="Registra series de gym para ver tu progresión de cargas" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={exerciseProgression}>
              <defs>
                <linearGradient id="fillProgression" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.aqua} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLOR.aqua} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                domain={["auto", "auto"]}
                width={32}
              />
              <Tooltip content={<ChartTooltip unit=" kg" />} cursor={{ stroke: COLOR.baseline, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="maxWeight"
                stroke={COLOR.aqua}
                strokeWidth={2}
                fill="url(#fillProgression)"
                dot={{ r: 3, fill: COLOR.aqua, stroke: COLOR.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: COLOR.aqua, stroke: COLOR.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={Target} iconColor="text-orange-400" title="Precisión de tiro" subtitle="Básquet — % de tiros anotados">
        {shootingSeries.length === 0 ? (
          <EmptyState text="Registra sesiones de básquet con tiros para ver tu precisión" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={shootingSeries}>
              <defs>
                <linearGradient id="fillShooting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR.orange} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={COLOR.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLOR.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: COLOR.muted, fontSize: 11 }}
                axisLine={{ stroke: COLOR.baseline }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: COLOR.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: COLOR.baseline, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke={COLOR.orange}
                strokeWidth={2}
                fill="url(#fillShooting)"
                dot={{ r: 3, fill: COLOR.orange, stroke: COLOR.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: COLOR.orange, stroke: COLOR.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function StatTile({
  icon,
  gradient,
  iconClassName,
  label,
  value,
  delta,
  trend,
  trendColor,
}: {
  icon: LucideIcon;
  gradient: string;
  iconClassName: string;
  label: string;
  value: number;
  delta?: number | null;
  trend?: { total: number }[];
  trendColor: string;
}) {
  const DeltaIcon = !delta ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor =
    delta == null || delta === 0
      ? "text-[var(--ink-muted)]"
      : delta > 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3.5"
    >
      <div className="flex items-start justify-between">
        <IconBadge icon={icon} gradient={gradient} iconClassName={iconClassName} size="sm" />
        {delta != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${deltaColor}`}>
            <DeltaIcon size={12} strokeWidth={2.5} />
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums mt-2">
        <CountUp value={value} />
      </p>
      <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">{label}</p>

      {trend && trend.length > 1 && (
        <div className="h-8 -mx-1 -mb-1 mt-2 opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="total"
                stroke={trendColor}
                strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function ChartCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <Icon size={15} strokeWidth={2.25} className={iconColor} />
        <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-[var(--ink-muted)] mb-2 ml-[23px]">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-[var(--ink-muted)] py-8 text-center">{text}</p>;
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--app-bg)] px-3 py-2 text-xs shadow-lg">
      <p className="text-[var(--ink-tertiary)] mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--ink-secondary)]">{p.name}</span>
            <b className="text-[var(--ink)] ml-auto tabular-nums">
              {p.value}
              {unit ?? ""}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
