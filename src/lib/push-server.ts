import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:soporte@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

/**
 * Envía una notificación push a una suscripción. Si la suscripción ya no es
 * válida (410/404), devuelve `expired: true` para que quien llama la borre
 * de la base de datos.
 */
export async function sendPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; expired?: boolean }> {
  if (!ensureConfigured()) return { ok: false };

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) return { ok: false, expired: true };
    return { ok: false };
  }
}
