// public/firebase-messaging-sw.js
/* global firebase, self, clients */
// ↑ Le dice a ESLint que firebase, self y clients son globals del Service Worker
//   No es un error real — importScripts los carga en el scope global del SW

importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDU0pm6MTjxjNWuDpNeGT0kfsPxX8JTdak",
  authDomain: "desarrollo-investigaciones.firebaseapp.com",
  projectId: "desarrollo-investigaciones",
  storageBucket: "desarrollo-investigaciones.firebasestorage.app",
  messagingSenderId: "293865702055",
  appId: "1:293865702055:web:c68f99ac47e943bcacd182",
});

const messaging = firebase.messaging();

// ── Mensajes en BACKGROUND / app cerrada ─────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Mensaje background:", payload);

  const notification = payload.notification ?? {};
  const data = payload.data ?? {};

  self.registration.showNotification(
    notification.title ?? "⚽ CLTiene Mundial",
    {
      body: notification.body ?? "Tienes una notificación nueva",
      icon: notification.icon ?? "/logo.png",
      badge: "/logo.png",
      data,
      vibrate: [200, 100, 200],
      tag: "cltiene-mundial",
      renotify: true,
      actions: [
        { action: "abrir", title: "📲 Ver ahora" },
        { action: "cerrar", title: "Ignorar" },
      ],
    },
  );
});

// ── Clic en la notificación → abrir / enfocar la app ─────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "cerrar") return;

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
