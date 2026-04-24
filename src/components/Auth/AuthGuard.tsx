"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppState } from "@/lib/useStore";
import { Role } from "@/lib/mockDB";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { state, hydrated } = useAppState();
    const router = useRouter();
    const pathname = usePathname();
    // "checking" = esperando confirmación, "authorized" = OK, "denied" = sin permiso
    const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "denied">("checking");

    useEffect(() => {
        if (!hydrated) return;

        const checkAuth = async () => {
            // 1. Verificar si hay usuario autenticado
            if (!state.user) {
                // Pequeña espera para asegurar que Supabase resolvió
                const timer = setTimeout(() => {
                    if (!state.user) {
                        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
                    }
                }, 2000);
                return () => clearTimeout(timer);
            }

            // 2. Esperar a que los datos terminen de cargar desde Supabase
            if (state.loading) {
                setAuthStatus("checking");
                return;
            }

            // 3. Validar si el usuario está vinculado a un empleado
            if (!state.currentEmployee) {
                setAuthStatus("denied");
                return;
            }

            // 4. Validar roles permitidos
            if (allowedRoles && allowedRoles.length > 0) {
                if (!allowedRoles.includes(state.currentEmployee.role)) {
                    setAuthStatus("denied");
                    return;
                }
            }

            setAuthStatus("authorized");
        };

        checkAuth();
    }, [state.user, state.currentEmployee, state.loading, hydrated, allowedRoles, router, pathname]);

    // Acceso a globalState para verificar en el timeout
    function globalStateHasUser() {
        return !!state.user;
    }

    // Pantalla de carga mientras verificamos
    if (!hydrated || authStatus === "checking") {
        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", gap: "1.5rem" }}>
                <div style={{
                    border: "4px solid rgba(255, 255, 255, 0.1)",
                    borderLeftColor: "var(--accent-color)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Verificando permisos...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Acceso denegado por rol
    if (authStatus === "denied") {
        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", padding: "2rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "5rem", marginBottom: "1rem" }}>🚫</h1>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Acceso Denegado</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: "500px" }}>
                    {state.currentEmployee 
                        ? `Tu cuenta (${state.user?.email}) no tiene los permisos necesarios (Rol: ${state.currentEmployee.role}) para acceder a esta sección.`
                        : `Tu cuenta (${state.user?.email}) no está vinculada a ningún registro de empleado en el sistema. Por favor, contacta a un administrador para que asigne tu ID de usuario en la tabla de empleados.`}
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={() => router.push('/')} className="btn-primary" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>Volver al Inicio</button>
                    <button onClick={() => {
                        supabase.auth.signOut().then(() => router.push('/login'));
                    }} className="btn-primary">Cerrar Sesión y Reintentar</button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
