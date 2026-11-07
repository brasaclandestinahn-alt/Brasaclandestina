"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppState } from "@/lib/useStore";
import { Role } from "@/lib/mockDB";

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { state, hydrated } = useAppState();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!hydrated) return;

        // Si no hay sesión ni usuario autenticado, redirigir al login
        if (!state.session && !state.user) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [state.session, state.user, hydrated, router, pathname]);

    // Si aún no está hidratado o no hay sesión, mostrar pantalla de carga
    if (!hydrated || (!state.session && !state.user)) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--bg-primary)",
                gap: "1.5rem"
            }}>
                <div style={{
                    border: "4px solid rgba(255, 255, 255, 0.1)",
                    borderLeftColor: "var(--accent-color, #ff6b00)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Verificando sesión...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Si se especifican roles permitidos y el usuario no cumple
    if (allowedRoles && allowedRoles.length > 0 && state.currentEmployee) {
        if (!allowedRoles.includes(state.currentEmployee.role)) {
            return (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--bg-primary)",
                    padding: "2rem",
                    textAlign: "center"
                }}>
                    <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚫</h1>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Acceso Restringido</h2>
                    <p style={{ color: "var(--text-muted)", maxWidth: "450px", marginBottom: "1.5rem" }}>
                        Tu rol actual ({state.currentEmployee.role}) no tiene permisos para acceder a esta área.
                    </p>
                    <button onClick={() => router.push("/")} className="btn-primary">
                        Volver al Menú
                    </button>
                </div>
            );
        }
    }

    return <>{children}</>;
}
