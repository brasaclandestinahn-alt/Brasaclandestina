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
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="login-page">
            <div className="login-card">
                <header className="login-card__header">
                    <h1 className="login-card__logo">Clandestina</h1>
                    <p className="login-card__subtitle">Panel de Control Interno</p>
                </header>

                <form className="login-card__form" onSubmit={handleLogin}>
                    <div className="login-card__field">
                        <div className="login-card__input-wrapper">
                            <span className="login-card__icon">✉️</span>
                            <input 
                                type="email" 
                                className="login-card__input" 
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-card__field">
                        <div className="login-card__input-wrapper">
                            <span className="login-card__icon">🔒</span>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="login-card__input" 
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button" 
                                className="login-card__toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <div className="login-card__options">
                        <a href="#" className="login-card__link login-card__link--forgot">¿Olvidaste tu contraseña?</a>
                    </div>

                    {error && (
                        <div className="login-card__error">
                             ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="login-card__button" 
                        disabled={loading}
                    >
                        {loading ? "CARGANDO..." : "ENTRAR AL PANEL"}
                    </button>
                    
                    <footer className="login-card__footer">
                        <button 
                            type="button" 
                            className="login-card__link login-card__link--back"
                            onClick={() => router.push('/')}
                        >
                            ← Volver al Menú Digital
                        </button>
                    </footer>
                </form>
            </div>

            <style jsx>{`
                :root {
                    --color-bg-start: #1a1c2c;
                    --color-bg-end: #0d0e15;
                    --color-primary: #ff6b00;
                    --color-primary-dark: #e66000;
                    --color-text-main: #ffffff;
                    --color-text-muted: #6b7280;
                    --color-input-bg: #374151;
                    --color-input-placeholder: #9ca3af;
                    --shadow-card: 0 20px 40px rgba(0, 0, 0, 0.3);
                    --shadow-focus: 0 0 0 4px rgba(255, 107, 0, 0.2);
                }

                .login-page {
                    display: flex;
                    min-height: 100vh;
                    background: radial-gradient(circle, #1a1c2c 0%, #0d0e15 100%);
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .login-card {
                    width: 90%;
                    max-width: 450px;
                    background: #ffffff;
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    animation: slideUp 0.5s ease-out;
                    margin: auto;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .login-card__header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .login-card__logo {
                    font-size: 32px;
                    font-weight: 800;
                    color: #ff6b00;
                    margin: 0;
                    letter-spacing: -1px;
                }

                .login-card__subtitle {
                    font-size: 14px;
                    color: #6b7280;
                    margin-top: 8px;
                }

                .login-card__form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .login-card__input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .login-card__icon {
                    position: absolute;
                    left: 16px;
                    font-size: 16px;
                    pointer-events: none;
                }

                .login-card__input {
                    width: 100%;
                    background: #374151;
                    border: 2px solid transparent;
                    border-radius: 12px;
                    padding: 15px 16px 15px 48px;
                    color: #ffffff;
                    font-size: 16px;
                    transition: all 0.2s ease;
                }

                .login-card__input::placeholder {
                    color: #9ca3af;
                }

                .login-card__input:focus {
                    outline: none;
                    border-color: #ff6b00;
                    box-shadow: var(--shadow-focus);
                    background: #2d3748;
                }

                .login-card__toggle-password {
                    position: absolute;
                    right: 16px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .login-card__options {
                    text-align: right;
                    margin-top: -10px;
                }

                .login-card__link {
                    font-size: 14px;
                    color: #ff6b00;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                }

                .login-card__link--forgot:hover {
                    text-decoration: underline;
                }

                .login-card__button {
                    background: #ff6b00;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    padding: 16px;
                    font-size: 16px;
                    font-weight: 800;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 14px 0 rgba(255, 107, 0, 0.39);
                }

                .login-card__button:hover {
                    background: #e66000;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(255, 107, 0, 0.45);
                }

                .login-card__button:active {
                    transform: scale(0.98);
                }

                .login-card__button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .login-card__error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    text-align: center;
                }

                .login-card__footer {
                    text-align: center;
                    margin-top: 10px;
                }

                .login-card__link--back {
                    color: #6b7280;
                }

                .login-card__link--back:hover {
                    color: #111827;
                }

                @media (max-width: 480px) {
                    .login-card {
                        padding: 30px 20px;
                        border-radius: 20px;
                    }
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
