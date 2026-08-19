// Service worker de App Gym: solo maneja notificaciones push (no cachea
// assets — Next.js ya sirve todo rápido vía CDN). Mantenerlo simple evita
// bugs de contenido desactualizado en una PWA que se actualiza seguido.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "App Gym", body: "Tenés novedades", url: "/dashboard" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
