"use client";
import Link from "next/link";
import { useAppState } from "@/lib/useStore";

export default function AdminDashboard() {
  const { state, hydrated } = useAppState();

  if (!hydrated) return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "200px", height: "40px" }}></div>
    </div>
  );

  const totalSales = state.orders.reduce((acc, o) => acc + o.total, 0);
  const avgTicket = state.orders.length > 0 ? totalSales / state.orders.length : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Unificado */}
      <aside style={{ width: "260px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--accent-color)", letterSpacing: "1px" }}>BRASA ADMIN</h2>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="/admin" className="sidebar-link active" style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", color: "var(--accent-color)", borderLeft: "3px solid var(--accent-color)", padding: "0.8rem 1rem", borderRadius: "4px" }}>Dashboard Central</Link>
          <Link href="/admin/orders" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Historial de Pedidos</Link>
          <Link href="/admin/inventory" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Inventario y Recetas</Link>
          <Link href="/admin/pricing" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Configuración</Link>
          
          <div style={{ marginTop: "1.5rem", padding: "0 1rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Operaciones</div>
          <Link href="/pos" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Punto de Venta (POS)</Link>
          <Link href="/kds" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Cocina (KDS)</Link>
        </nav>

        <Link href="/" target="_blank" style={{ marginTop: "auto", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)", textAlign: "center", fontSize: "0.875rem" }}> Ver Menú Digital </Link>
      </aside>

      {/* Hero Dashboard */}
      <main style={{ flex: 1, padding: "3rem", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
            <div>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-1px" }}>Resumen de Rendimiento</h1>
                <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Monitoreo en tiempo real de Brasa Clandestina.</p>
            </div>
            <button className="btn-primary" style={{ padding: "0.8rem 1.5rem", fontSize: "0.75rem" }}>Descargar Reporte (CSV)</button>
        </header>

        {/* Stats Grid - Estilo Imagen 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--accent-color)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Ventas del Día</p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent-color)", marginTop: "0.5rem" }}>L {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--success)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Órdenes Pagadas</p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "0.5rem" }}>{state.orders.length}</h3>
            </div>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--warning)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Ticket Promedio</p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "0.5rem" }}>L {avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
        </div>

        {/* Quick Access Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <Link href="/admin/inventory" className="glass-panel" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", transition: "var(--transition-smooth)", textDecoration: "none" }}>
                <div style={{ padding: "1rem", backgroundColor: "rgba(249, 115, 22, 0.1)", borderRadius: "var(--radius-md)", width: "fit-content" }}>📦</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>Gestión de Inventario</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Control de insumos, stock bajo y recetas (BOM).</p>
                <span style={{ color: "var(--accent-color)", fontWeight: 700, marginTop: "1rem" }}>Ir al Kardex →</span>
            </Link>

            <Link href="/admin/orders" className="glass-panel" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", transition: "var(--transition-smooth)", textDecoration: "none" }}>
                <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", width: "fit-content" }}>📝</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>Historial de Operaciones</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Revisión de tickets, reembolsos y estados logísticos.</p>
                <span style={{ color: "var(--success)", fontWeight: 700, marginTop: "1rem" }}>Ver Órdenes →</span>
            </Link>
        </div>
      </main>
    </div>
  );
}
