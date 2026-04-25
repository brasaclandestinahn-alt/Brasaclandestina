"use client";
import { useEffect, useState } from "react";
import { subscribeToSyncState } from "@/lib/useStore";

interface SyncState {
  failed: number;
  lastError: string | null;
  lastErrorTime: number | null;
}

export default function SyncIndicator() {
  const [syncState, setSyncState] = useState<SyncState>({ 
    failed: 0, 
    lastError: null, 
    lastErrorTime: null 
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSyncState((state) => {
      setSyncState(state);
      if (state.failed > 0) setDismissed(false);
    });
    return unsubscribe;
  }, []);

  if (syncState.failed === 0 || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 90,
      left: 16,
      zIndex: 10000,
      background: "rgba(232, 89, 60, 0.95)",
      color: "white",
      padding: "10px 14px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      maxWidth: 320,
      animation: "slideUpFade 0.3s ease"
    }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>
          {syncState.failed} operación{syncState.failed > 1 ? "es" : ""} 
          {" "}sin sincronizar
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
          Reintentando automáticamente...
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          fontSize: 16,
          cursor: "pointer",
          padding: 0,
          opacity: 0.7
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideUpFade {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
