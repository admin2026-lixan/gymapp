"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

export function SuccessToast({ message, show }: { message: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className="fixed left-1/2 bottom-24 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-emerald-500 text-neutral-950 font-semibold text-sm px-4 py-2.5 shadow-lg shadow-emerald-500/20"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 500 }}
            className="flex items-center justify-center"
          >
            <Check size={16} strokeWidth={3} />
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
