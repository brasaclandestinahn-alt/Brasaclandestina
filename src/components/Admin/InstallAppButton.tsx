"use client";

import React, { useState, useEffect } from "react";

// Tipado local para el evento de instalación (no incluido por defecto en TypeScript/Next.js)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1 & 2. Detectar si la app ya está instalada
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
      
    setIsInstalled(isStandalone);

    // Si ya está instalada, no necesitamos inicializar el resto de listeners
    if (isStandalone) return;

    // Detectar si el usuario está en iOS (excluyendo MSStream)
    const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsIOS(true);
    }

    // 3. Escuchar el evento beforeinstallprompt en Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Si ya está instalada, NO renderizar nada
  if (isInstalled) {
    return null;
  }

  // Si no está instalada, pero tampoco estamos en iOS ni tenemos prompt, no mostrar
  // (opcional: quitar esta validación si se desea forzar el botón en otros navegadores)
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    // 4. En iOS, mostrar el modal con instrucciones
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // En Android/Chrome, llamar al prompt
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <>
      {/* 5. Botón visible con estilos inline requeridos */}
      <button
        onClick={handleInstallClick}
        style={{
          backgroundColor: "var(--accent-color)",
          color: "white",
          padding: "0.6rem 1rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.85rem",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {isIOS ? "📲 Cómo instalar en iPhone" : "📲 Instalar App"}
      </button>

      {/* Modal para iOS Safari */}
      {showIOSModal && isIOS && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1.5rem"
          }}
        >
          <div
            style={{
              backgroundColor: "var(--background, #111)",
              color: "white",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg, 12px)",
              maxWidth: "350px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.2rem" }}>
              Instalar App en iOS
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              <p style={{ margin: 0 }}>
                1. Toca el botón <strong>Compartir</strong> (icono cuadrado con flecha hacia arriba) en la barra inferior de Safari.
              </p>
              <p style={{ margin: 0 }}>
                2. Desplázate y selecciona <strong>"Añadir a pantalla de inicio"</strong>.
              </p>
              <p style={{ margin: 0 }}>
                3. Confirma tocando <strong>"Añadir"</strong>.
              </p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                width: "100%",
                backgroundColor: "var(--accent-color)",
                color: "white",
                padding: "0.8rem",
                borderRadius: "var(--radius-md)",
                fontSize: "1rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
