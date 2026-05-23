"use client";

import React from "react";
import useNotifications from "@/lib/useNotifications";

export default function NotificationsToggle() {
  const { permission, isSupported, requestPermission } = useNotifications();

  if (!isSupported) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
          🔕 Notificaciones no soportadas en este navegador
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {permission === "granted" && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--success, #22c55e)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>🔔</span>
          <span>Notificaciones activas</span>
        </div>
      )}

      {permission === "denied" && (
        <div style={{ fontSize: "0.65rem", color: "var(--danger, #ef4444)" }}>
          🔕 Notificaciones bloqueadas. Habilítalas desde la configuración del
          navegador.
        </div>
      )}

      {permission === "default" && (
        <button
          onClick={() => requestPermission()}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            backgroundColor: "var(--accent-color)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          🔔 Activar alertas de órdenes
        </button>
      )}
    </div>
  );
}
