"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import ProfitDistributionModule from "@/components/Finance/ProfitDistributionModule";
import FinanceCharts from "@/components/Finance/FinanceCharts";

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

  // Cálculo Dinámico de COGS y Desglose por Grupos
  let totalCogs = 0;
  const cogsByGroup: Record<string, number> = {};

  validOrders.forEach(order => {
    order.items.forEach(item => {
      const product = state.products.find(p => p.id === item.product_id);
      if (product && product.recipe) {
        product.recipe.forEach(rec => {
          const ing = state.ingredients.find(i => i.id === rec.ingredient_id);
          if (ing) {
            const itemCogs = item.quantity * rec.quantity * ing.cost_per_unit;
            totalCogs += itemCogs;
            
            const groupName = ing.group || "Otros / Varios";
            cogsByGroup[groupName] = (cogsByGroup[groupName] || 0) + itemCogs;
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Ventas</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Finanzas</Link>
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

        <FinanceCharts 
          grossRevenue={grossRevenue}
          totalCogs={totalCogs}
          cogsByGroup={cogsByGroup}
        />

        <ProfitDistributionModule 
          orders={state.orders} 
          products={state.products} 
          ingredients={state.ingredients} 
          orderStatuses={state.orderStatuses}
        />

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start", marginTop: "2rem" }}>

          </div>

          {/* Desglose de Gastos por Categoría de Insumos */}
          <div className="glass-panel" style={{ flex: 1, minWidth: "300px", padding: "2rem", borderLeft: "4px solid var(--warning)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>🍽️ Distribución de Costos (COGS)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {Object.keys(cogsByGroup).length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>Sin datos de insumos consumidos.</p>
              ) : (
                Object.entries(cogsByGroup)
                  .sort((a,b) => b[1] - a[1])
                  .map(([group, amount]) => {
                    const percentage = totalCogs > 0 ? (amount / totalCogs) * 100 : 0;
                    return (
                      <div key={group} style={{ padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{group}</span>
                          <span style={{ fontWeight: 800, color: "var(--accent-color)" }}>L {amount.toFixed(2)}</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: "var(--accent-color)", transition: "width 1s ease-in-out" }}></div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {percentage.toFixed(1)}% del costo total
                        </div>
                      </div>
                    );
                  })
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
