"use client";
import { useEffect, useState } from "react";
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
    // "checking" = esperando confirmación, "authorized" = OK, "denied" = sin permiso
    const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "denied">("checking");

    useEffect(() => {
        if (!hydrated) return;

        // Si no hay sesión aún, esperamos un momento antes de redirigir
        // para dar tiempo a que checkUser() resuelva la sesión de Supabase
        if (!state.user) {
            const timer = setTimeout(() => {
                // Si después de 2.5s sigue sin sesión, mandamos al login
                if (!globalStateHasUser()) {
                    router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
                }
            }, 2500);
            return () => clearTimeout(timer);
        }

        // Hay sesión, ahora validamos el rol
        if (allowedRoles && allowedRoles.length > 0) {
            if (!state.currentEmployee) {
                // currentEmployee aún no cargó, esperar
                setAuthStatus("checking");
                return;
            }
            if (!allowedRoles.includes(state.currentEmployee.role)) {
                setAuthStatus("denied");
                return;
            }
        }

        setAuthStatus("authorized");
    }, [state.user, state.currentEmployee, hydrated, allowedRoles, router, pathname]);

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
                    Tu cuenta ({state.user?.email}) no tiene los permisos necesarios (Rol: {state.currentEmployee?.role || 'Ninguno'}) para acceder a esta sección.
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={() => router.push('/')} className="btn-primary" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>Volver al Inicio</button>
                    <button onClick={() => router.push('/login')} className="btn-primary">Cambiar de Cuenta</button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
