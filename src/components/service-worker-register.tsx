"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* el navegador no soporta service workers o falló el registro; la app
         sigue funcionando igual, solo sin push ni instalación offline */
    });
  }, []);

  return null;
}
