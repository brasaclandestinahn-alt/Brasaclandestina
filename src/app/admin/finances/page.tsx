"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

export default function FinancesDashboard() {
  const { state } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  // Filtrar solo las ordenes no canceladas
  const validOrders = state.orders.filter(o => {
    const statusObj = (state.orderStatuses || []).find(s => s.id === o.status);
    return statusObj?.category !== "cancelled";
  });

  // Cálculo de Ingresos Brutos
  const grossRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);

  // Cálculo Dinámico de COGS (Cost Of Goods Sold - Costo de Ventas)
  let totalCogs = 0;
  validOrders.forEach(order => {
    order.items.forEach(item => {
      const product = state.products.find(p => p.id === item.product_id);
      if (product && product.recipe) {
        product.recipe.forEach(rec => {
          const ing = state.ingredients.find(i => i.id === rec.ingredient_id);
          if (ing) {
            // Cantidad del producto vendido * cantidad de ingrediente por receta * costo del ingrediente
            totalCogs += item.quantity * rec.quantity * ing.cost_per_unit;
          }
        });
      }
    });
  });

  // Ganancia y Margen
  const grossProfit = grossRevenue - totalCogs;
  const marginPercentage = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  // Analítica por Métodos de Pago
  const paymentStats = validOrders.reduce((acc, o) => {
    const method = o.payment_method || "efectivo";
    if (!acc[method]) acc[method] = { count: 0, sum: 0 };
    acc[method].count += 1;
    acc[method].sum += o.total;
    return acc;
  }, {} as Record<string, { count: number; sum: number }>);

  // Rendimiento de Platillos
  const productPerformance = state.products.map(p => {
    let soldQty = 0;
    let earnedRev = 0;
    validOrders.forEach(o => {
      const soldItem = o.items.find(i => i.product_id === p.id);
      if (soldItem) {
        soldQty += soldItem.quantity;
        earnedRev += soldItem.subtotal;
      }
    });

    let singleUnitCogs = 0;
    if (p.recipe) {
      p.recipe.forEach(rec => {
        const ing = state.ingredients.find(i => i.id === rec.ingredient_id);
        if (ing) singleUnitCogs += rec.quantity * ing.cost_per_unit;
      });
    }

    return { 
      name: p.name, 
      soldQty, 
      earnedRev, 
      singleUnitGrossProfit: p.price - singleUnitCogs,
      totalGrossProfit: earnedRev - (singleUnitCogs * soldQty)
    };
  }).filter(p => p.soldQty > 0).sort((a,b) => b.earnedRev - a.earnedRev);

  return (
  const menuItems = [
    { label: "Menu BC", icon: "📖", href: "/admin" },
    { label: "Control de pedidos", icon: "📋", href: "/admin/orders" },
    { label: "Gestión de Precios", icon: "💰", href: "/admin/pricing" },
    { label: "Inventario", icon: "🍴", href: "/admin/inventory" },
    { label: "Ventas", icon: "📈", href: "/admin/finances", active: true },
    { label: "Envíos", icon: "🛵", href: "/admin/orders" },
    { label: "Configuración", icon: "⚙️", href: "/admin/settings" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar - Brasa Light Premium */}
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
                    textDecoration: "none", color: item.active ? "#f97316" : "#6b7280", fontWeight: item.active ? 700 : 500,
                    backgroundColor: item.active ? "#fff7ed" : "transparent",
                    borderLeft: item.active ? "4px solid #f97316" : "4px solid transparent"
                }}
            >
                <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        <header style={{ height: "70px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937", fontWeight: 700 }}>
                <span>📈</span> VENTAS Y FINANZAS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>jhonsroksg</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#fff7ed", color: "#f97316", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>ADMIN</div>
                </div>
            </div>
        </header>

        <div style={{ padding: "2rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Estado Financiero y Rentabilidad</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: "600px" }}>Análisis económico cruzando las ventas activas contra los costos unitarios actuales de tu bodega.</p>
        </header>

        {/* Global KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--success)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingresos Brutos</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>L {grossRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--warning)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Costo de Ventas (COGS)</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>- L {totalCogs.toFixed(2)}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-color)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ganancia Bruta Libre</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-color)", marginTop: "0.5rem" }}>L {grossProfit.toFixed(2)}</p>
            <span style={{ display: "inline-block", marginTop: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "100px", fontSize: "0.875rem", fontWeight: 700, backgroundColor: marginPercentage >= 40 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: marginPercentage >= 40 ? "var(--success)" : "var(--danger)" }}>
              {marginPercentage.toFixed(1)}% Margen Operativo
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Métodos de Pago */}
          <div className="glass-panel" style={{ flex: 1, minWidth: "300px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>🏦 Desglose por Forma de Pago</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {Object.keys(paymentStats).length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No hay registros de pago activos.</p>
              ) : (
                Object.entries(paymentStats).map(([method, stat]) => (
                  <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <div>
                      <h4 style={{ textTransform: "capitalize", fontWeight: 700, marginBottom: "0.25rem" }}>{method}</h4>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{stat.count} transacciones</p>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--accent-color)" }}>
                      L {stat.sum.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Rendimiento de Productos */}
          <div className="glass-panel" style={{ flex: 2, minWidth: "400px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>📈 Rentabilidad por Platillo (Top Ventas)</h2>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Platillo</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600, textAlign: "center" }}>Vendidos</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600, textAlign: "right" }}>Rev. Bruto</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600, textAlign: "right" }}>Beneficio (Total)</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay ventas registradas aún.</td>
                  </tr>
                ) : (
                  productPerformance.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>{p.soldQty}</td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-primary)", fontWeight: 600 }}>L {p.earnedRev.toFixed(2)}</td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: p.totalGrossProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
                        L {p.totalGrossProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
