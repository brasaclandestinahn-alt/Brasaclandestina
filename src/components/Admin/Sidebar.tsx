"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAppState();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard Central", icon: "📊" },
    { href: "/admin/orders", label: "Ventas", icon: "💰" },
    { href: "/admin/inventory", label: "Inventario (Insumos)", icon: "📦" },
    { href: "/admin/pricing", label: "Catálogo y Precios", icon: "🏷️" },
    { href: "/admin/expenses", label: "Gastos", icon: "💸" },
    { href: "/admin/finances", label: "Finanzas", icon: "🏦" },
    { href: "/admin/settings", label: "Configuración", icon: "⚙️" },
  ];

  const operativeModules = [
    { href: "/pos", label: "Terminal de Ventas (POS)", icon: "🖥️" },
    { href: "/kds", label: "Pantalla de Cocina (KDS)", icon: "👨‍🍳" },
    { href: "/delivery", label: "App Repartidores", icon: "🛵" },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="mobile-only"
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 1000,
          padding: "0.5rem",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          cursor: "pointer",
          fontSize: "1.25rem"
        }}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 998,
            backdropFilter: "blur(2px)"
          }}
          className="mobile-only"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        style={{ 
          width: "250px", 
          backgroundColor: "var(--bg-secondary)", 
          borderRight: "1px solid var(--border-color)", 
          padding: "1.5rem", 
          display: "flex", 
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 999,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          overflowY: "auto"
        }}
        className="sidebar-responsive"
      >
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", backgroundColor: "var(--accent-color)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>🔥</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-color)", margin: 0 }}>Brasa Admin</h2>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsOpen(false)}
                style={{ 
                  padding: "0.75rem 1rem", 
                  borderRadius: "var(--radius-md)", 
                  color: isActive ? "white" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--accent-color)" : "transparent",
                  fontWeight: isActive ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "var(--transition-fast)"
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "1rem" }}>
            Módulos Operativos
          </div>
          
          {operativeModules.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              style={{ 
                padding: "0.75rem 1rem", 
                borderRadius: "var(--radius-md)", 
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "0.9rem"
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <Link 
            href="/" 
            target="_blank" 
            style={{ 
              marginTop: "1rem",
              padding: "0.75rem 1rem", 
              borderRadius: "var(--radius-md)", 
              color: "var(--text-muted)", 
              border: "1px dashed var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.85rem"
            }}
          >
            🌐 Ver Menú Digital
          </Link>
        </nav>

        <button 
          onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
          style={{ 
            padding: "1rem", 
            borderRadius: "var(--radius-md)", 
            color: "var(--danger)", 
            border: "none", 
            background: "rgba(239, 68, 68, 0.05)", 
            fontWeight: 700, 
            cursor: "pointer", 
            textAlign: "left", 
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </aside>

      <style jsx>{`
        @media (min-width: 769px) {
          .sidebar-responsive {
            transform: translateX(0) !important;
            position: sticky !important;
          }
        }
      `}</style>
    </>
  );
}
