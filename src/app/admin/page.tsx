"use client";
import Link from "next/link";
import { useAppState } from "@/lib/useStore";

export default function AdminDashboard() {
  const { state, hydrated } = useAppState();

  if (!hydrated) return null;

  const totalSales = state.orders.reduce((acc, o) => acc + o.total, 0);
  const avgTicket = state.orders.length > 0 ? totalSales / state.orders.length : 0;

  const menuItems = [
    { label: "Menu BC", icon: "📖", href: "/admin" },
    { label: "Control de pedidos", icon: "📋", href: "/admin/orders" },
    { label: "Gestión de Precios", icon: "💰", href: "/admin/pricing" },
    { label: "Inventario", icon: "🍴", href: "/admin/inventory" },
    { label: "Ventas", icon: "📈", href: "/admin/finances" },
    { label: "Envíos", icon: "🛵", href: "/admin/orders" },
    { label: "Configuración", icon: "⚙️", href: "/admin/settings" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar - Replicating Approved Style */}
      <aside style={{ width: "260px", backgroundColor: "white", padding: "1.5rem", display: "flex", flexDirection: "column", borderRight: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div style={{ color: "#f97316", fontSize: "2rem" }}>🍴</div>
            <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f97316", lineHeight: 1 }}>Brasa</h2>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1f2937", lineHeight: 1 }}>Clandestina</h2>
            </div>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {menuItems.map((item, idx) => (
            <Link 
                key={idx} 
                href={item.href} 
                style={{ 
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "8px",
                    textDecoration: "none", color: item.href === "/admin" ? "#f97316" : "#6b7280", fontWeight: item.href === "/admin" ? 700 : 500,
                    backgroundColor: item.href === "/admin" ? "#fff7ed" : "transparent",
                    borderLeft: item.href === "/admin" ? "4px solid #f97316" : "4px solid transparent"
                }}
            >
                <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" target="_blank" style={{ marginTop: "auto", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed #e5e7eb", color: "#6b7280", textAlign: "center", fontSize: "0.875rem", textDecoration: "none" }}> Ver Menú Digital </Link>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        <header style={{ height: "70px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937", fontWeight: 700 }}>
                <span>🎯</span> DASHBOARD CENTRAL
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span>🌙</span>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>jhonsroksg</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#fff7ed", color: "#f97316", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>ADMIN</div>
                </div>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}></div>
            </div>
        </header>

        <div style={{ padding: "2.5rem" }}>
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#111827", letterSpacing: "-1px" }}>Resumen de Rendimiento</h1>
                <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Bienvenido de nuevo, Jhon. Aquí están las métricas de hoy.</p>
            </div>

            {/* KPI Cards - Replicating Image 2 Grid Style */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
                <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "20px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px" }}>Ventas del Día</p>
                    <h3 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#f97316", marginTop: "0.5rem" }}>L {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "20px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px" }}>Órdenes Activas</p>
                    <h3 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#111827", marginTop: "0.5rem" }}>{state.orders.length}</h3>
                </div>
                <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "20px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px" }}>Ticket Promedio</p>
                    <h3 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#111827", marginTop: "0.5rem" }}>L {avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Practical Access Sections */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <Link href="/admin/inventory" style={{ textDecoration: "none", backgroundColor: "white", padding: "2rem", borderRadius: "20px", display: "flex", gap: "1.5rem", alignItems: "center", border: "1px solid #e5e7eb", transition: "0.2s" }}>
                    <div style={{ fontSize: "2.5rem", backgroundColor: "#fff7ed", padding: "1.5rem", borderRadius: "15px" }}>📦</div>
                    <div>
                        <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>Inventario y BOM</h4>
                        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>Control de insumos y auditoría Kardex.</p>
                    </div>
                </Link>
                <Link href="/admin/pricing" style={{ textDecoration: "none", backgroundColor: "white", padding: "2rem", borderRadius: "20px", display: "flex", gap: "1.5rem", alignItems: "center", border: "1px solid #e5e7eb", transition: "0.2s" }}>
                    <div style={{ fontSize: "2.5rem", backgroundColor: "#f0fdf4", padding: "1.5rem", borderRadius: "15px" }}>🍴</div>
                    <div>
                        <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>Catálogo Maestro</h4>
                        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>Ajuste de precios y platos destacados.</p>
                    </div>
                </Link>
            </div>
        </div>
      </main>
    </div>
  );
}
