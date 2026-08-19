"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Columns2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tap } from "@/components/tap";
import { SuccessToast } from "@/components/success-toast";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { useSuccessToast } from "@/lib/use-success-toast";
import type { ProgressPhoto } from "@/lib/types";

type PhotoWithUrl = ProgressPhoto & { url: string | null };

export default function PhotosClient({ initialPhotos }: { initialPhotos: PhotoWithUrl[] }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useSuccessToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) return;

      const { data: inserted, error } = await supabase
        .from("progress_photos")
        .insert({ user_id: user.id, storage_path: path })
        .select("*")
        .single();
      if (error || !inserted) return;

      const { data: signed } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(path, 60 * 60);

      setPhotos((prev) => [
        { ...(inserted as ProgressPhoto), url: signed?.signedUrl ?? null },
        ...prev,
      ]);
      toast.trigger("Foto guardada");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto(photo: PhotoWithUrl) {
    await supabase.storage.from("progress-photos").remove([photo.storage_path]);
    await supabase.from("progress_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setSelected((prev) => prev.filter((id) => id !== photo.id));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const comparePhotos = selected
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is PhotoWithUrl => Boolean(p))
    // Más antigua primero ("antes"), más nueva después ("ahora"), sin importar
    // el orden en que se tocaron las miniaturas.
    .sort((a, b) => a.taken_at.localeCompare(b.taken_at));

  return (
    <div className="space-y-5 pb-4">
      <SuccessToast show={toast.show} message={toast.message} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Fotos de progreso</h1>
          <p className="text-sm text-[var(--ink-muted)]">Tu cambio físico, en imágenes</p>
        </div>
        <Link href="/metrics" className="flex items-center gap-1 text-xs text-emerald-500">
          <ArrowLeft size={13} /> Medidas
        </Link>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <Tap
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-neutral-950 font-bold py-3.5 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Camera size={16} strokeWidth={2.5} />
          {uploading ? "Subiendo..." : "Nueva foto"}
        </Tap>
        <Tap
          onClick={() => {
            setCompareMode((v) => !v);
            setSelected([]);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-2xl font-medium py-3.5 text-sm border ${
            compareMode
              ? "bg-emerald-500 text-neutral-950 border-emerald-500"
              : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-secondary)]"
          }`}
        >
          <Columns2 size={16} strokeWidth={2.25} />
          Comparar
        </Tap>
      </div>

      {compareMode && (
        <p className="text-xs text-[var(--ink-muted)] text-center">
          Elegí 2 fotos y arrastrá el slider para compararlas ({selected.length}/2)
        </p>
      )}

      {compareMode && comparePhotos.length === 2 && comparePhotos[0].url && comparePhotos[1].url && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <BeforeAfterSlider
            beforeUrl={comparePhotos[0].url}
            afterUrl={comparePhotos[1].url}
            beforeLabel={comparePhotos[0].taken_at}
            afterLabel={comparePhotos[1].taken_at}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence>
          {photos.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <button
                onClick={() => (compareMode ? toggleSelect(p.id) : undefined)}
                className={`relative block w-full aspect-square rounded-xl overflow-hidden border-2 ${
                  compareMode && selected.includes(p.id)
                    ? "border-emerald-500"
                    : "border-transparent"
                }`}
              >
                {p.url ? (
                  <Image src={p.url} alt={p.taken_at} fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--surface)]" />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                  {p.taken_at}
                </span>
              </button>
              {!compareMode && (
                <button
                  onClick={() => removePhoto(p)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                  aria-label="Eliminar foto"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {photos.length === 0 && (
        <p className="text-sm text-[var(--ink-muted)] text-center py-10">
          Todavía no subiste fotos. Sacá la primera para empezar a ver tu evolución
        </p>
      )}
    </div>
  );
}
