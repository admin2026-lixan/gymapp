"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { AssistantChat } from "@/components/assistant-chat";

/**
 * Botón flotante del entrenador IA, presente en toda la app (montado en el
 * layout protegido). Al tocarlo abre un panel deslizante desde abajo con el
 * chat completo, sin salir de la pantalla en la que estás.
 */
export function AssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // En la pantalla dedicada /assistant el chat ya está de cuerpo entero.
  if (pathname?.startsWith("/assistant")) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente"
        className="fixed right-4 bottom-24 z-30 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/30"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-emerald-400/40"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bot size={24} strokeWidth={2.25} className="text-neutral-950" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[88dvh] rounded-t-3xl bg-[var(--app-bg)] border-t border-[var(--border)] shadow-2xl flex flex-col"
            >
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-secondary)]"
              >
                <X size={15} strokeWidth={2.25} />
              </button>
              <div className="flex-1 min-h-0 px-4 pb-4">
                <AssistantChat heightClass="h-full" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
