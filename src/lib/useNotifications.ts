"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionState = NotificationPermission | "unsupported";

interface UseNotificationsReturn {
  /** Estado actual del permiso de notificaciones */
  permission: PermissionState;
  /** true si el navegador soporta la API de Notifications */
  isSupported: boolean;
  /** Solicita permiso al usuario. Devuelve el estado resultante. */
  requestPermission: () => Promise<PermissionState>;
  /** Muestra una notificación si el permiso es 'granted'. */
  showNotification: (title: string, options?: NotificationOptions) => void;
}

const DEFAULT_NOTIFICATION_OPTIONS: NotificationOptions = {
  icon: "/icons/icon-192x192.png",
  badge: "/icons/icon-192x192.png",
  vibrate: [200, 100, 200],
  requireInteraction: false,
};

export default function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<PermissionState>(() => {
    // SSR guard: en el servidor siempre reportamos 'unsupported'
    if (typeof window === "undefined") return "unsupported";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    // Sincronizar por si cambió entre el initializer y el mount
    setPermission(Notification.permission);
  }, []);

  const isSupported = permission !== "unsupported";

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    const current = Notification.permission;

    if (current === "granted") {
      setPermission("granted");
      return "granted";
    }

    if (current === "denied") {
      setPermission("denied");
      return "denied";
    }

    // current === 'default' → preguntar al usuario
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions): void => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const mergedOptions: NotificationOptions = {
        ...DEFAULT_NOTIFICATION_OPTIONS,
        ...options,
      };

      // Preferir Service Worker (funciona mejor en mobile / bandeja del sistema)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, mergedOptions);
          })
          .catch(() => {
            // Fallback si el SW no está disponible
            new Notification(title, mergedOptions);
          });
      } else {
        // Sin SW: notificación directa
        new Notification(title, mergedOptions);
      }
    },
    []
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
