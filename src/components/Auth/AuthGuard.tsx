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
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!hydrated) return;

        // Si no hay sesión, redirigir a login
        if (!state.user) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        // Si hay roles específicos requeridos, validar el rol del empleado vinculado
        if (allowedRoles && allowedRoles.length > 0) {
            if (!state.currentEmployee || !allowedRoles.includes(state.currentEmployee.role)) {
                setIsAuthorized(false);
                return;
            }
        }

        setIsAuthorized(true);
    }, [state.user, state.currentEmployee, hydrated, allowedRoles, router, pathname]);

    if (!hydrated || !state.user) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
                <div className="loader"></div>
                <style jsx>{`
                    .loader {
                        border: 4px solid rgba(255, 255, 255, 0.1);
                        border-left-color: var(--accent-color);
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (allowedRoles && !isAuthorized) {
        return (
            <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", padding: "2rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "5rem", marginBottom: "1rem" }}>🚫</h1>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Acceso Denegado</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: "500px" }}>
                    Tu cuenta ({state.user.email}) no tiene los permisos necesarios (Rol: {state.currentEmployee?.role || 'Ninguno'}) para acceder a esta sección.
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
