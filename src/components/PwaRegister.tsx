"use client";
import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const wb = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // 1. Detectar si ya hay un worker esperando activación
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowReload(true);
        }

        // 2. Escuchar nuevas versiones que se descarguen en segundo plano
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nueva versión lista para reemplazar a la actual
              setWaitingWorker(newWorker);
              setShowReload(true);
            }
          });
        });

        // 3. Revisar actualizaciones periódicamente (cada 15 minutos)
        const intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);

        return () => clearInterval(intervalId);
      } catch (error) {
        console.error("[PWA] Error en registro de ServiceWorker:", error);
      }
    };

    window.addEventListener("load", wb);

    // Escuchar cuando el nuevo Service Worker tome el control para recargar
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowReload(false);
  };

  if (!showReload) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        backgroundColor: "#111827",
        color: "#ffffff",
        padding: "0.75rem 1.25rem",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        border: "1px solid #374151",
      }}
    >
      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
        ⚡ Nueva versión disponible
      </span>
      <button
        onClick={handleUpdate}
        style={{
          backgroundColor: "var(--accent-color, #ff6b00)",
          color: "#ffffff",
          border: "none",
          padding: "0.4rem 0.8rem",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "0.8rem",
          cursor: "pointer",
        }}
      >
        Actualizar ahora
      </button>
    </div>
  );
}
