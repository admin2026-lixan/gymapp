"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, ClipboardList, LayoutDashboard, Library, Ruler, Bot, type LucideIcon } from "lucide-react";

const ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/log", icon: Zap, label: "Registrar" },
  { href: "/routines", icon: ClipboardList, label: "Rutinas" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/assistant", icon: Bot, label: "Asistente" },
  { href: "/exercises", icon: Library, label: "Ejercicios" },
  { href: "/metrics", icon: Ruler, label: "Medidas" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-[var(--border)] bg-[var(--app-bg)]/80 backdrop-blur-xl z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 py-2.5"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute top-0.5 h-0.5 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                />
              )}
              <motion.span
                animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                  active ? "bg-emerald-500/15" : ""
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={2.25}
                  className={active ? "text-emerald-400" : "text-[var(--ink-muted)]"}
                />
              </motion.span>
              <span className={`text-[11px] ${active ? "text-emerald-400 font-medium" : "text-[var(--ink-muted)]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
