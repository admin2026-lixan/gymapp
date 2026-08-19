"use client";

import { useCallback, useRef, useState } from "react";

export function useSuccessToast(duration = 1600) {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(
    (msg: string) => {
      setMessage(msg);
      setShow(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(15);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), duration);
    },
    [duration]
  );

  return { message, show, trigger };
}
