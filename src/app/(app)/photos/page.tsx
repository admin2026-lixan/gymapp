import { createClient } from "@/lib/supabase/server";
import PhotosClient from "./photos-client";
import type { ProgressPhoto } from "@/lib/types";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .order("taken_at", { ascending: false });

  const rows = (photos as ProgressPhoto[]) ?? [];

  const withUrls = await Promise.all(
    rows.map(async (p) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(p.storage_path, 60 * 60); // 1 hora
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return <PhotosClient initialPhotos={withUrls} />;
}
