import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/push-server";

/**
 * Envía una notificación a todos los dispositivos suscritos de un usuario,
 * y borra de la base las suscripciones que ya expiraron (410/404).
 */
export async function sendToUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result.expired) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    })
  );
}
