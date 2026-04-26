"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";
import ProfitDistributionModule from "@/components/Finance/ProfitDistributionModule";
import FinanceCharts from "@/components/Finance/FinanceCharts";
import { Order, OrderItem, Product, Ingredient, OrderStatusConfig, Expense } from "@/lib/mockDB";

export default function FinancesDashboard() {
  const { state, signOut } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "todo">("mes");
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  // 3. periodoStart (cálculo del período actual)
  const now = new Date();
  const periodoStart = (() => {
    if (periodo === "hoy") {
      const d = new Date(now); d.setHours(0,0,0,0); return d;
    }
    if (periodo === "semana") {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d;
    }
    if (periodo === "mes") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1); return d;
    }
    return new Date(0); // "todo"
  })();

  // 4. validOrders (filtrado de órdenes del período actual)
  const validOrders = state.orders.filter((o: Order) => {
    const statusObj = (state.orderStatuses || []).find((s: OrderStatusConfig) => s.id === o.status);
    if (statusObj?.category === "cancelled") return false;
    if (periodo !== "todo") {
      const orderDate = new Date(o.created_at);
      if (orderDate < periodoStart) return false;
    }
    return true;
  });

  // 5. grossRevenue (suma de validOrders)
  const grossRevenue = validOrders.reduce((acc: number, o: Order) => acc + o.total, 0);

  // 6. Cálculo de COGS y cogsByGroup
  let totalCogs = 0;
  const cogsByGroup: Record<string, number> = {};

  validOrders.forEach((order: Order) => {
    order.items.forEach((item: OrderItem) => {
      const product = state.products.find((p: Product) => p.id === item.product_id);
      if (product && product.recipe) {
        product.recipe.forEach((rec: { ingredient_id: string; quantity: number }) => {
          const ing = state.ingredients.find((i: Ingredient) => i.id === rec.ingredient_id);
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

  // 7. grossProfit y marginPercentage
  const grossProfit = grossRevenue - totalCogs;
  const marginPercentage = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  // 8. periodoAnteriorStart y periodoAnteriorEnd
  const periodoAnteriorStart = (() => {
    if (periodo === "hoy") {
      const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(0,0,0,0); return d;
    }
    if (periodo === "semana") {
      const d = new Date(now); d.setDate(d.getDate() - 14); return d;
    }
    if (periodo === "mes") {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }
    return null;
  })();

  const periodoAnteriorEnd = (() => {
    if (periodo === "hoy") {
      const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(23,59,59,999); return d;
    }
    if (periodo === "semana") {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d;
    }
    if (periodo === "mes") {
      return new Date(now.getFullYear(), now.getMonth(), 0);
    }
    return null;
  })();

  // 9. previousOrders
  const previousOrders = periodoAnteriorStart && periodoAnteriorEnd
    ? state.orders.filter((o: Order) => {
        const statusObj = (state.orderStatuses || []).find((s: OrderStatusConfig) => s.id === o.status);
        if (statusObj?.category === "cancelled") return false;
        const orderDate = new Date(o.created_at);
        return orderDate >= periodoAnteriorStart && orderDate <= periodoAnteriorEnd;
      })
    : [];

  // 10. previousRevenue
  const previousRevenue = previousOrders.reduce((acc: number, o: Order) => acc + o.total, 0);

  // 11. getChange y revenueChange
  const getChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  const revenueChange = getChange(grossRevenue, previousRevenue);

  // 12. paymentStats
  const paymentStats = validOrders.reduce((acc: Record<string, { count: number; sum: number }>, o: Order) => {
    const method = o.payment_method || "efectivo";
    if (!acc[method]) acc[method] = { count: 0, sum: 0 };
    acc[method].count += 1;
    acc[method].sum += o.total;
    return acc;
  }, {} as Record<string, { count: number; sum: number }>);

  // 13. productPerformance
  const productPerformance = state.products.map((p: Product) => {
    let soldQty = 0;
    let earnedRev = 0;
    validOrders.forEach((o: Order) => {
      const soldItem = o.items.find((i: OrderItem) => i.product_id === p.id);
      if (soldItem) {
        soldQty += soldItem.quantity;
        earnedRev += soldItem.subtotal;
      }
    });

    let singleUnitCogs = 0;
    if (p.recipe) {
      p.recipe.forEach((rec: { ingredient_id: string; quantity: number }) => {
        const ing = state.ingredients.find((i: Ingredient) => i.id === rec.ingredient_id);
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
  }).filter((p: { soldQty: number }) => p.soldQty > 0).sort((a: any, b: any) => b.earnedRev - a.earnedRev);

  // 14. periodExpenses, totalOperationalExpenses, netProfit, netMargin
  const periodExpenses = state.expenses
    ? state.expenses.filter((e: Expense) => {
        if (e.status === "pending") return false;
        if (periodo !== "todo" && periodoStart) {
          const expDate = new Date(e.date);
          if (expDate < periodoStart) return false;
        }
        return true;
      })
    : [];

  const totalOperationalExpenses = periodExpenses.reduce(
    (acc: number, e: Expense) => acc + (e.amount || 0), 0
  );

  const netProfit = grossProfit - totalOperationalExpenses;
  const netMargin = grossRevenue > 0 
    ? (netProfit / grossRevenue) * 100 
    : 0;

  // 15. fmtL
  const fmtL = (val: number) => 
    `L. ${val.toLocaleString("es-HN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Estado Financiero y Rentabilidad</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: "600px", fontSize: "0.9rem" }}>Análisis económico cruzando las ventas activas contra los costos unitarios actuales de tu bodega.</p>
          </header>

          {/* Selector de período */}
          <div style={{ 
            display: "flex", 
            gap: "6px", 
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "2rem",
            padding: "6px",
            background: "var(--bg-secondary)",
            borderRadius: "100px",
            width: "fit-content",
            border: "1px solid var(--border-color)"
          }}>
            {([
              { key: "hoy", label: "Hoy" },
              { key: "semana", label: "Esta semana" },
              { key: "mes", label: "Este mes" },
              { key: "todo", label: "Histórico" }
            ] as const).map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: "none",
                  fontWeight: periodo === p.key ? 700 : 600,
                  background: periodo === p.key ? "var(--accent-color)" : "transparent",
                  color: periodo === p.key ? "white" : "var(--text-muted)",
                  transition: "all 150ms"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

        {/* Global KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--success)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingresos Brutos</h3>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", 
              margin: "4px 0 0", fontStyle: "italic" }}>
              {periodo === "todo" ? "Histórico acumulado" 
                : periodo === "mes" ? "Este mes" 
                : periodo === "semana" ? "Esta semana" 
                : "Hoy"}
            </p>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", whiteSpace: "nowrap" }}>{fmtL(grossRevenue)}</p>
            {revenueChange !== null && periodo !== "todo" && (
              <p style={{ 
                fontSize: "12px", fontWeight: 700, margin: "6px 0 0",
                display: "flex", alignItems: "center", gap: "4px",
                color: revenueChange > 0 ? "#16a34a" 
                  : revenueChange < 0 ? "#dc2626" 
                  : "var(--text-muted)"
              }}>
                {revenueChange > 0 ? "↑" : revenueChange < 0 ? "↓" : "→"}
                {" "}{Math.abs(revenueChange).toFixed(1)}% vs período anterior
              </p>
            )}
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--warning)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Costo de Ventas (COGS)</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", whiteSpace: "nowrap" }}>- {fmtL(totalCogs)}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-color)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ganancia Bruta Libre</h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-color)", marginTop: "0.5rem", whiteSpace: "nowrap" }}>{fmtL(grossProfit)}</p>
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
                          <span style={{ fontWeight: 800, color: "var(--accent-color)", whiteSpace: "nowrap" }}>{fmtL(amount)}</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "100px", overflow: "hidden" }}>
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
                  <th style={{ padding: "0.75rem", fontWeight: 700, 
                    fontSize: "0.72rem", letterSpacing: "0.05em",
                    textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Platillo
                  </th>
                  <th style={{ padding: "0.75rem", fontWeight: 700,
                    fontSize: "0.72rem", letterSpacing: "0.05em",
                    textTransform: "uppercase", color: "var(--text-muted)",
                    textAlign: "center", width: "80px" }}>
                    Vendidos
                  </th>
                  <th style={{ padding: "0.75rem", fontWeight: 700,
                    fontSize: "0.72rem", letterSpacing: "0.05em",
                    textTransform: "uppercase", color: "var(--text-muted)",
                    textAlign: "right", width: "130px", whiteSpace: "nowrap" }}>
                    Beneficio
                  </th>
                  <th style={{ padding: "0.75rem", fontWeight: 700,
                    fontSize: "0.72rem", letterSpacing: "0.05em",
                    textTransform: "uppercase", color: "var(--text-muted)",
                    textAlign: "center", width: "90px" }}>
                    Margen
                  </th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay ventas registradas aún.</td>
                  </tr>
                ) : (
                  productPerformance.map((p: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.875rem 0.75rem", fontWeight: 600, 
                        fontSize: "0.875rem" }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "0.875rem 0.75rem", textAlign: "center",
                        fontWeight: 700, color: "var(--text-muted)" }}>
                        {p.soldQty}
                      </td>
                      <td style={{ padding: "0.875rem 0.75rem", textAlign: "right",
                        fontWeight: 800, whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        color: p.totalGrossProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                        {fmtL(p.totalGrossProfit)}
                      </td>
                      <td style={{ padding: "0.875rem 0.75rem", textAlign: "center" }}>
                        {(() => {
                          const margin = p.earnedRev > 0 
                            ? (p.totalGrossProfit / p.earnedRev) * 100 
                            : 0;
                          const color = margin >= 40 ? "#16a34a" 
                            : margin >= 25 ? "#f59e0b" 
                            : "#dc2626";
                          return (
                            <span style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "100px",
                              fontSize: "11px",
                              fontWeight: 800,
                              backgroundColor: margin >= 40 ? "rgba(34,197,94,0.1)"
                                : margin >= 25 ? "rgba(245,158,11,0.1)"
                                : "rgba(220,38,38,0.1)",
                              color,
                              border: `1px solid ${color}30`
                            }}>
                              {margin.toFixed(0)}%
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ 
              display: "flex", gap: "1rem", flexWrap: "wrap",
              marginTop: "0.75rem", fontSize: "11px", color: "var(--text-muted)" 
            }}>
              <span>🟢 ≥40% excelente</span>
              <span>🟡 25-39% aceptable</span>
              <span>🔴 &lt;25% revisar precio</span>
            </div>
          </div>
        </div>

        {/* Sección: Utilidad Real después de gastos operativos */}
        <div className="glass-panel" style={{ 
          marginTop: "2rem",
          padding: "1.5rem 2rem",
          borderTop: "4px solid #7c3aed"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div>
              <h2 style={{ 
                fontSize: "1.1rem", fontWeight: 700, margin: 0,
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                💼 Utilidad Real (después de gastos operativos)
              </h2>
              <p style={{ 
                fontSize: "0.78rem", color: "var(--text-muted)", 
                margin: "4px 0 0" 
              }}>
                Solo incluye gastos marcados como "Pagado" en el módulo de Gastos.
              </p>
            </div>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            {/* Ganancia bruta (COGS) */}
            <div style={{ 
              padding: "1rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              borderLeft: "3px solid #22c55e"
            }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, 
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.05em", margin: 0 }}>
                Ganancia bruta
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, 
                color: "#22c55e", margin: "6px 0 0",
                whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {fmtL(grossProfit)}
              </p>
            </div>

            {/* Gastos operativos pagados */}
            <div style={{ 
              padding: "1rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              borderLeft: "3px solid #f59e0b"
            }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, 
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.05em", margin: 0 }}>
                Gastos operativos
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, 
                color: "#f59e0b", margin: "6px 0 0",
                whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                - {fmtL(totalOperationalExpenses)}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", 
                margin: "4px 0 0" }}>
                {periodExpenses.length} gastos pagados
              </p>
            </div>

            {/* Utilidad neta */}
            <div style={{ 
              padding: "1rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              borderLeft: `3px solid ${netProfit >= 0 ? "#7c3aed" : "#dc2626"}`
            }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, 
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.05em", margin: 0 }}>
                Utilidad neta
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, 
                color: netProfit >= 0 ? "#7c3aed" : "#dc2626",
                margin: "6px 0 0",
                whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {fmtL(netProfit)}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", 
                margin: "4px 0 0" }}>
                Margen neto: {netMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Desglose de gastos por categoría */}
          {periodExpenses.length > 0 && (
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, 
                color: "var(--text-muted)", marginBottom: "0.75rem",
                textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Desglose de gastos pagados
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(
                  periodExpenses.reduce((acc: Record<string, number>, e: Expense) => {
                    acc[e.category] = (acc[e.category] || 0) + e.amount;
                    return acc;
                  }, {} as Record<string, number>)
                )
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat} style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "var(--bg-tertiary)",
                    borderRadius: "6px",
                    fontSize: "0.82rem"
                  }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {cat}
                    </span>
                    <span style={{ 
                      color: "var(--text-muted)", fontWeight: 700,
                      whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums"
                    }}>
                      - {fmtL(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {periodExpenses.length === 0 && (
            <p style={{ 
              fontSize: "0.82rem", color: "var(--text-muted)",
              fontStyle: "italic", textAlign: "center",
              padding: "1rem"
            }}>
              No hay gastos operativos pagados en este período. 
              Regístralos en el módulo de Gastos.
            </p>
          )}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
