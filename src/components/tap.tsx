"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Wrapper con animación de "presión" (scale down + spring back) para que
 * cualquier botón se sienta táctil y con respuesta inmediata — clave para que
 * registrar datos se sienta rápido y satisfactorio, no una tarea pesada.
 */
export function Tap({ children, className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
