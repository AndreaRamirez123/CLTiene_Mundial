// src/hooks/useNotificaciones.js

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';


const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;


export function useNotificaciones({ uid, client }) {
  useEffect(() => {
    if (!uid) return;

    const configurar = async () => {
      try {
        // Pedir permiso al navegador
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') {
          console.warn('[FCM] Permiso denegado');
          return;
        }

        const messaging = getMessaging();
        const token     = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          // Guardar token en el backend
          await client.post(`/notificaciones/token/${uid}`, { token });
          console.log('[FCM] Token registrado ✅');
        }

        
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {};
          if (title) {
            new Notification(title, { body, icon: '/logo.png' });
          }
        });

      } catch (e) {
        console.error('Error configurando notificaciones:', e);
      }
    };

    configurar();
  }, [uid, client]);
}

export default useNotificaciones;
