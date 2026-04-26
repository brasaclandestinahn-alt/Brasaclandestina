"use client";
import React, { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";
import ProfitDistributionModule from "@/components/Finance/ProfitDistributionModule";
import FinanceCharts from "@/components/Finance/FinanceCharts";
import DateFilter from "@/components/Admin/DateFilter";
import { Order, OrderItem, Product, Ingredient, OrderStatusConfig, Expense } from "@/lib/mockDB";

type PeriodoKey = "hoy" | "semana" | "mes" | "personalizado" | "todo";

function getLunesActual(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getDomingoActual(base: Date): Date {
  const lunes = getLunesActual(base);
  const dom = new Date(lunes);
  dom.setDate(lunes.getDate() + 6);
  dom.setHours(23, 59, 59, 999);
  return dom;
}

export default function FinancesDashboard() {
  const { state } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  
  // Rango de fechas centralizado
  const [range, setRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
  });
  const [rangeLabel, setRangeLabel] = useState("Este mes");

  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const now = new Date();

  const periodoStart = range.start;
  const periodoEnd = range.end;

  // Cálculo de período anterior (solo para comparativa visual si es Hoy, Semana o Mes)
  const periodoAnteriorStart: Date | null = (() => {
    if (rangeLabel === "Hoy") { const d = new Date(now); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return d; }
    if (rangeLabel === "Esta semana") { 
      const d = new Date(periodoStart); d.setDate(d.getDate() - 7); return d; 
    }
    if (rangeLabel === "Este mes") return new Date(now.getFullYear(), now.getMonth()-1, 1);
    return null;
  })();

  const periodoAnteriorEnd: Date | null = (() => {
    if (rangeLabel === "Hoy") { const d = new Date(now); d.setDate(d.getDate()-1); d.setHours(23,59,59,999); return d; }
    if (rangeLabel === "Esta semana") { 
      const d = new Date(periodoEnd); d.setDate(d.getDate() - 7); return d; 
    }
    if (rangeLabel === "Este mes") return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return null;
  })();

  const validOrders = state.orders.filter((o: Order) => {
    const s = (state.orderStatuses || []).find((st: OrderStatusConfig) => st.id === o.status);
    if (s?.category === "cancelled") return false;
    const d = new Date(o.created_at);
    return d >= periodoStart && d <= periodoEnd;
  });

  const grossRevenue = validOrders.reduce((acc: number, o: Order) => acc + o.total, 0);

  let totalCogs = 0;
  const cogsByGroup: Record<string, number> = {};
  validOrders.forEach((order: Order) => {
    order.items.forEach((item: OrderItem) => {
      const product = state.products.find((p: Product) => p.id === item.product_id);
      if (product?.recipe) {
        product.recipe.forEach((rec: { ingredient_id: string; quantity: number }) => {
          const ing = state.ingredients.find((i: Ingredient) => i.id === rec.ingredient_id);
          if (ing) {
            const cost = item.quantity * rec.quantity * ing.cost_per_unit;
            totalCogs += cost;
            const g = ing.group || "Otros / Varios";
            cogsByGroup[g] = (cogsByGroup[g] || 0) + cost;
          }
        });
      }
    });
  });

  const grossProfit = grossRevenue - totalCogs;
  const marginPercentage = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  const previousOrders = periodoAnteriorStart && periodoAnteriorEnd
    ? state.orders.filter((o: Order) => {
        const s = (state.orderStatuses || []).find((st: OrderStatusConfig) => st.id === o.status);
        if (s?.category === "cancelled") return false;
        const d = new Date(o.created_at);
        return d >= periodoAnteriorStart! && d <= periodoAnteriorEnd!;
      })
    : [];
  const previousRevenue = previousOrders.reduce((acc: number, o: Order) => acc + o.total, 0);
  const getChange = (cur: number, prev: number) => prev === 0 ? null : ((cur - prev) / prev) * 100;
  const revenueChange = getChange(grossRevenue, previousRevenue);

  const productPerformance = state.products.map((p: Product) => {
    let soldQty = 0, earnedRev = 0;
    validOrders.forEach((o: Order) => {
      const item = o.items.find((i: OrderItem) => i.product_id === p.id);
      if (item) { soldQty += item.quantity; earnedRev += item.subtotal; }
    });
    let unitCogs = 0;
    p.recipe?.forEach((rec: { ingredient_id: string; quantity: number }) => {
      const ing = state.ingredients.find((i: Ingredient) => i.id === rec.ingredient_id);
      if (ing) unitCogs += rec.quantity * ing.cost_per_unit;
    });
    return { name: p.name, soldQty, earnedRev, totalGrossProfit: earnedRev - unitCogs * soldQty };
  }).filter((p: { soldQty: number }) => p.soldQty > 0).sort((a: any, b: any) => b.earnedRev - a.earnedRev);

  const periodExpenses = (state.expenses || []).filter((e: Expense) => {
    if (e.status === "pending") return false;
    const d = new Date(e.date);
    return d >= periodoStart && d <= periodoEnd;
  });
  const totalOperationalExpenses = periodExpenses.reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);
  const netProfit = grossProfit - totalOperationalExpenses;
  const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const fmtL = (val: number) =>
    `L. ${val.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const periodoFormatted = (() => {
    const fmt = (d: Date) => d.toLocaleDateString("es-HN", { day: "numeric", month: "short" });
    return `${fmt(periodoStart)} – ${fmt(periodoEnd)}`;
  })();

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />
        <main className="main-content-responsive">

          <header style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Estado Financiero y Rentabilidad</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Análisis económico cruzando ventas contra costos de insumos.</p>
          </header>

          {/* Selector de período con DateFilter */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-end",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                Filtrar por rango
              </p>
              <DateFilter 
                onDateChange={(start, end, label) => {
                  setRange({ start, end });
                  setRangeLabel(label);
                }} 
                initialLabel="Este mes" 
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Resumen de <strong style={{ color: "var(--text-primary)", fontStyle: "normal" }}>{rangeLabel}</strong>
              </p>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-color)" }}>
                {periodoFormatted}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid #22c55e" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Ingresos Brutos</h3>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtL(grossRevenue)}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>{validOrders.length} órdenes · {rangeLabel}</p>
              {revenueChange !== null && rangeLabel !== "Personalizado" && (
                <p style={{ fontSize: "12px", fontWeight: 700, margin: "6px 0 0", color: revenueChange > 0 ? "#16a34a" : revenueChange < 0 ? "#dc2626" : "var(--text-muted)" }}>
                  {revenueChange > 0 ? "↑" : revenueChange < 0 ? "↓" : "→"} {Math.abs(revenueChange).toFixed(1)}% vs período anterior
                </p>
              )}
            </div>
            <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid #f59e0b" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Costo de Ventas (COGS)</h3>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>- {fmtL(totalCogs)}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>{grossRevenue > 0 ? `${((totalCogs / grossRevenue) * 100).toFixed(1)}% de ingresos` : "—"}</p>
            </div>
            <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-color)" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Ganancia Bruta</h3>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-color)", marginTop: "0.5rem", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtL(grossProfit)}</p>
              <span style={{ display: "inline-block", marginTop: "0.5rem", padding: "3px 10px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700, backgroundColor: marginPercentage >= 40 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: marginPercentage >= 40 ? "#16a34a" : "#dc2626" }}>
                {marginPercentage.toFixed(1)}% margen
              </span>
            </div>
          </div>

          <FinanceCharts grossRevenue={grossRevenue} totalCogs={totalCogs} cogsByGroup={cogsByGroup} />
          <ProfitDistributionModule orders={state.orders} products={state.products} ingredients={state.ingredients} orderStatuses={state.orderStatuses} />

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start", marginTop: "2rem" }}>
            <div className="glass-panel" style={{ flex: 1, minWidth: "280px", padding: "1.5rem", borderLeft: "4px solid #f59e0b" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>🍽️ Distribución de Costos (COGS)</h2>
              {Object.keys(cogsByGroup).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin datos.</p>
              ) : Object.entries(cogsByGroup).sort((a, b) => b[1] - a[1]).map(([group, amount]) => {
                const pct = totalCogs > 0 ? (amount / totalCogs) * 100 : 0;
                return (
                  <div key={group} style={{ padding: "0.875rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{group}</span>
                      <span style={{ fontWeight: 800, color: "var(--accent-color)", whiteSpace: "nowrap", fontSize: "0.82rem" }}>{fmtL(amount)}</span>
                    </div>
                    <div style={{ width: "100%", height: "5px", backgroundColor: "var(--bg-secondary)", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--accent-color)", transition: "width 0.8s ease" }} />
                    </div>
                    <p style={{ textAlign: "right", fontSize: "0.7rem", color: "var(--text-muted)", margin: "3px 0 0" }}>{pct.toFixed(1)}% del costo</p>
                  </div>
                );
              })}
            </div>

            <div className="glass-panel" style={{ flex: 2, minWidth: "360px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>📈 Rentabilidad por Platillo</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "360px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-tertiary)" }}>
                      <th style={{ padding: "0.75rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Platillo</th>
                      <th style={{ padding: "0.75rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "center", width: "70px" }}>Vtas.</th>
                      <th style={{ padding: "0.75rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>Beneficio</th>
                      <th style={{ padding: "0.75rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "center", width: "80px" }}>Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin ventas en este período.</td></tr>
                    ) : productPerformance.map((p: any, idx: number) => {
                      const margin = p.earnedRev > 0 ? (p.totalGrossProfit / p.earnedRev) * 100 : 0;
                      const mc = margin >= 40 ? "#16a34a" : margin >= 25 ? "#f59e0b" : "#dc2626";
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "0.75rem", fontWeight: 600, fontSize: "0.85rem" }}>{p.name}</td>
                          <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>{p.soldQty}</td>
                          <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: p.totalGrossProfit >= 0 ? "#16a34a" : "#dc2626" }}>{fmtL(p.totalGrossProfit)}</td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: `${mc}18`, color: mc, border: `1px solid ${mc}40` }}>{margin.toFixed(0)}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "11px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span>🟢 ≥40% excelente</span><span>🟡 25-39% aceptable</span><span>🔴 &lt;25% revisar precio</span>
              </div>
            </div>
          </div>

          {/* Utilidad Real */}
          <div className="glass-panel" style={{ marginTop: "2rem", padding: "1.5rem 2rem", borderTop: "4px solid #7c3aed" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>💼 Utilidad Real (después de gastos operativos)</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 1.25rem" }}>Solo gastos "Pagado" · {rangeLabel}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", borderLeft: "3px solid #22c55e" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Ganancia bruta</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#22c55e", margin: "6px 0 0", whiteSpace: "nowrap" }}>{fmtL(grossProfit)}</p>
              </div>
              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", borderLeft: "3px solid #f59e0b" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Gastos operativos</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b", margin: "6px 0 0", whiteSpace: "nowrap" }}>- {fmtL(totalOperationalExpenses)}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "3px 0 0" }}>{periodExpenses.length} gastos pagados</p>
              </div>
              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", borderLeft: `3px solid ${netProfit >= 0 ? "#7c3aed" : "#dc2626"}` }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Utilidad neta</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: netProfit >= 0 ? "#7c3aed" : "#dc2626", margin: "6px 0 0", whiteSpace: "nowrap" }}>{fmtL(netProfit)}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "3px 0 0" }}>Margen neto: {netMargin.toFixed(1)}%</p>
              </div>
            </div>
            {periodExpenses.length > 0 ? (
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Desglose de gastos pagados</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {(Object.entries(
                    periodExpenses.reduce((acc: Record<string, number>, e: Expense) => {
                      acc[e.category] = (acc[e.category] || 0) + e.amount; return acc;
                    }, {} as Record<string, number>)
                  ) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: "var(--bg-tertiary)", borderRadius: "6px", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>- {fmtL(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                No hay gastos pagados en este período. Regístralos en el módulo de Gastos.
              </p>
            )}
          </div>

        </main>
      </div>
    </AuthGuard>
  );
}
