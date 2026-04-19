"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

export default function AdminDashboard() {
  const { state } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // El stock ya no vive en el producto directamente, sino en los ingredientes (BOM)
  // Eliminamos los cálculos erróneos que bloquean el build de Vercel
  
  // Financiamiento: Excluir órdenes canceladas del cálculo
  const validOrders = state.orders.filter(o => {
    const statusObj = (state.orderStatuses || []).find(s => s.id === o.status);
    return statusObj?.category !== "cancelled";
  });
  const totalSales = validOrders.reduce((acc, o) => acc + o.total, 0);

  if (!hydrated) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Ventas</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Configuración</Link>
          
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>Módulos Operativos</div>
          <Link href="/pos" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Terminal de Ventas (POS)</Link>
          <Link href="/kds" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Pantalla de Cocina (KDS)</Link>
          <Link href="/delivery" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>App Repartidores</Link>
          
          <Link href="/" target="_blank" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)", marginTop: "auto", border: "1px dashed var(--border-color)" }}>Ver Menú Digital (PWA)</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Resumen de Rendimiento</h1>
          <button className="btn-primary">Descargar Reporte (CSV)</button>
        </header>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ventas del Día</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>L {totalSales.toFixed(2)}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Órdenes Pagadas/Activas</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>{validOrders.length}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
             <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ticket Promedio</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>L {(validOrders.length > 0 ? (totalSales / validOrders.length) : 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", borderLeft: "4px solid var(--accent-color)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Gestión de Inventario y Materias Primas</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            El sistema de control de existencias opera independientemente mediante Insumos y Recetas (BOM).
          </p>
          <Link href="/admin/inventory" className="btn-primary" style={{ display: "inline-block" }}>
            Ir a Control de Inventarios
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", borderLeft: "4px solid var(--accent-color)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Gestión de Talento Humano y Logística</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            El reclutamiento de vendedores, seguimiento de rendimiento y control de repartidores se aloja ahora en su entorno dedicado.
          </p>
          <Link href="/admin/employees" className="btn-primary" style={{ display: "inline-block" }}>
            Administrar Empleados Roles
          </Link>
        </div>
      </main>
    </div>
  );
}
