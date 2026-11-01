"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/useStore";

function LoginForm() {
  const { signIn, state, hydrated } = useAppState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Si ya tiene sesión activa, redirigir automáticamente al panel
  useEffect(() => {
    if (hydrated && state.user) {
      router.push(returnUrl);
    }
  }, [hydrated, state.user, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push(returnUrl);
    } catch (err: any) {
      if (err.message?.includes("Invalid login credentials")) {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("El correo no ha sido confirmado en Supabase.");
      } else {
        setError("No pudimos iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0d0e15",
      padding: "1.5rem",
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#161824",
        borderRadius: "20px",
        padding: "2.5rem",
        boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
        border: "1px solid #282c3f"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px",
            height: "56px",
            backgroundColor: "rgba(255, 107, 0, 0.12)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            margin: "0 auto 1rem"
          }}>
            🔥
          </div>
          <h1 style={{ color: "#ff6b00", fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Brasa Clandestina
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Panel de Control Interno
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nombre@ejemplo.com"
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "10px",
                backgroundColor: "#222638",
                border: "1px solid #374151",
                color: "#ffffff",
                outline: "none",
                fontSize: "0.95rem"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "0.85rem", marginBottom: "0.4rem", fontWeight: 600 }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.8rem 2.5rem 0.8rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: "#222638",
                  border: "1px solid #374151",
                  color: "#ffffff",
                  outline: "none",
                  fontSize: "0.95rem"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: 0
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              color: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              padding: "0.75rem",
              borderRadius: "10px",
              fontSize: "0.85rem",
              textAlign: "center",
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.9rem",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#ff6b00",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 14px rgba(255,107,0,0.35)",
              marginTop: "0.5rem"
            }}
          >
            {loading ? "Verificando..." : "ENTRAR AL PANEL"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "0.85rem",
              cursor: "pointer",
              marginTop: "0.5rem",
              textAlign: "center"
            }}
          >
            ← Volver al Menú Digital
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0d0e15", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
