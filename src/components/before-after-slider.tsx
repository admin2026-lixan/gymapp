"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // % desde la izquierda
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  }

  function onPointerUp() {
    draggingRef.current = false;
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--border)] select-none touch-none cursor-ew-resize"
    >
      {/* Capa "después" (imagen completa, de fondo) */}
      <Image src={afterUrl} alt={afterLabel} fill unoptimized className="object-cover" draggable={false} />

      {/* Capa "antes" (recortada hasta el % del slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeUrl}
          alt={beforeLabel}
          fill
          unoptimized
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Etiquetas */}
      <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-1 rounded-full">
        {beforeLabel}
      </span>
      <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-1 rounded-full">
        {afterLabel}
      </span>

      {/* Línea divisoria + manija */}
      <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-900">
          <MoveHorizontal size={16} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
