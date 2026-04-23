"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/useStore";

function LoginContent() {
    const { signIn, state, hydrated } = useAppState();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl") || "/admin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (hydrated && state.user) {
            router.push(returnUrl);
        }
    }, [state.user, hydrated, router, returnUrl]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signIn(email, password);
            router.push(returnUrl);
        } catch (err: any) {
            console.error(err);
            setError(err.message === "Invalid login credentials" ? "Credenciales inválidas. Verifica tu correo y contraseña." : err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!hydrated) return null;

    return (
        <div style={{ 
            display: "flex", minHeight: "100vh", backgroundColor: "#0f172a", 
            backgroundImage: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent), radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.1), transparent)",
            alignItems: "center", justifyContent: "center", padding: "1.5rem" 
        }}>
            <div className="glass-panel" style={{ 
                width: "100%", maxWidth: "420px", padding: "3rem", borderRadius: "2rem", 
                border: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(20px)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
            }}>
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "white", marginBottom: "0.5rem", letterSpacing: "-0.025em" }}>
                        Brasa <span style={{ color: "var(--accent-color)" }}>Clandestina</span>
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "1.125rem" }}>Panel de Control Interno</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Correo Electrónico</label>
                        <input 
                            type="email" 
                            className="input-field" 
                            placeholder="nombre@ejemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", borderColor: "rgba(255,255,255,0.1)" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Contraseña</label>
                        <input 
                            type="password" 
                            className="input-field" 
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", borderColor: "rgba(255,255,255,0.1)" }}
                        />
                    </div>

                    {error && (
                        <div style={{ 
                            padding: "1rem", borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", 
                            border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.875rem", fontWeight: 600
                        }}>
                             ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={loading}
                        style={{ 
                            padding: "1rem", fontSize: "1rem", fontWeight: 800, marginTop: "0.5rem",
                            boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)"
                        }}
                    >
                        {loading ? "Iniciando sesión..." : "Entrar al Panel"}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => router.push('/')}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", marginTop: "0.5rem" }}
                    >
                        ← Volver al Menú Digital
                    </button>
                </form>
            </div>

            <style jsx>{`
                .input-field:focus {
                    background-color: rgba(15, 23, 42, 0.8) !important;
                    border-color: var(--accent-color) !important;
                }
            `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
