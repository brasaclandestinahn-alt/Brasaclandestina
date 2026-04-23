"use client";
import { useState, useEffect } from 'react';

/**
 * Brasa Clandestina - Consent & Privacy Banner (GDPR Ready)
 * Handles analytics and pixel consent with a premium dark theme.
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bc-cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleConsent = (type: 'all' | 'essential') => {
    localStorage.setItem('bc-cookie-consent', type);
    localStorage.setItem('bc-consent-date', new Date().toISOString());
    setShow(false);
    
    // In a production environment, you would trigger the load of GA4/Pixels here
    if (type === 'all') {
        window.location.reload(); // Quick way to trigger GoogleAnalytics component in layout
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '600px',
      backgroundColor: 'rgba(20,20,20,0.95)',
      backdropFilter: 'blur(15px)',
      border: '1px solid var(--border-color)',
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      zIndex: 5000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '2rem' }}>🍪</span>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Mejoramos tu experiencia</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Usamos cookies para entender cómo navegas y mejorar nuestro menú. Al aceptar, nos ayudas a ofrecerte un servicio más rápido.
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => handleConsent('essential')}
          style={{ 
            backgroundColor: 'transparent', 
            color: 'var(--text-muted)', 
            border: 'none', 
            fontSize: '0.75rem', 
            cursor: 'pointer',
            padding: '0.5rem 1rem'
          }}
        >
          Solo esenciales
        </button>
        <button 
          onClick={() => handleConsent('all')}
          className="btn-primary"
          style={{ fontSize: '0.8rem', padding: '0.5rem 1.5rem' }}
        >
          Aceptar Todo
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
