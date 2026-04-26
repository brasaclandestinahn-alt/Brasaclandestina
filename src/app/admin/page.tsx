"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";
import { 
  calculateMetrics, 
  filterOrdersByDateRange, 
  getDateRanges,
  getPercentChange 
} from "@/lib/financialMetrics";
import { generateDailyReport } from "@/lib/reportGenerator";

type PeriodoKey = "hoy" | "semana" | "mes" | "personalizado" | "todo";

function getLunesActual(base: Date): Date {
  const d = new Date(base); d.setHours(0,0,0,0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function getDomingoActual(base: Date): Date {
  const l = getLunesActual(base);
  const d = new Date(l); d.setDate(l.getDate() + 6); d.setHours(23,59,59,999);
  return d;
}

function ChangeIndicator({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) return <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>— sin datos previos</p>;
  const isNeutral = Math.abs(value) < 1;
  const color = isNeutral ? "var(--text-muted)" : value > 0 ? "#22c55e" : "#E8593C";
  const arrow = isNeutral ? "→" : value > 0 ? "↑" : "↓";
  return <p style={{ fontSize: "0.7rem", color, margin: 0, fontWeight: 700 }}>{arrow} {Math.abs(value).toFixed(1)}% {suffix}</p>;
}

export default function AdminDashboard() {
  const { state, signOut } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoKey>("hoy");
  const todayStr = new Date().toISOString().split("T")[0];
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  useEffect(() => setHydrated(true), []);

  const now = new Date();
  const ranges = getDateRanges();

  // ── Rango del período seleccionado ──────────────────────────────────────
  const periodoStart: Date = (() => {
    if (periodo === "hoy") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
    if (periodo === "semana") return getLunesActual(now);
    if (periodo === "mes") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (periodo === "personalizado") { const d = new Date(customStart+"T00:00:00"); return isNaN(d.getTime()) ? new Date(0) : d; }
    return new Date(0);
  })();

  const periodoEnd: Date = (() => {
    if (periodo === "hoy") { const d = new Date(now); d.setHours(23,59,59,999); return d; }
    if (periodo === "semana") return getDomingoActual(now);
    if (periodo === "mes") return new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    if (periodo === "personalizado") { const d = new Date(customEnd+"T23:59:59"); return isNaN(d.getTime()) ? new Date() : d; }
    return new Date();
  })();

  // ── Rango anterior (para comparativa) ───────────────────────────────────
  const prevStart: Date | null = (() => {
    if (periodo === "hoy") { const d = new Date(now); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return d; }
    if (periodo === "semana") { const l = getLunesActual(now); const p = new Date(l); p.setDate(l.getDate()-7); return p; }
    if (periodo === "mes") return new Date(now.getFullYear(), now.getMonth()-1, 1);
    return null;
  })();
  const prevEnd: Date | null = (() => {
    if (periodo === "hoy") { const d = new Date(now); d.setDate(d.getDate()-1); d.setHours(23,59,59,999); return d; }
    if (periodo === "semana") { const l = getLunesActual(now); const p = new Date(l); p.setDate(l.getDate()-1); p.setHours(23,59,59,999); return p; }
    if (periodo === "mes") return new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999);
    return null;
  })();

  // ── Filtrar órdenes ─────────────────────────────────────────────────────
  const periodOrders = filterOrdersByDateRange(state.orders, state.orderStatuses || [], periodoStart, periodoEnd);
  const prevOrders = prevStart && prevEnd ? filterOrdersByDateRange(state.orders, state.orderStatuses || [], prevStart, prevEnd) : [];

  const metrics = calculateMetrics(periodOrders, state.products, state.ingredients);
  const prevMetrics = calculateMetrics(prevOrders, state.products, state.ingredients);

  const salesChange = getPercentChange(metrics.totalSales, prevMetrics.totalSales);
  const ordersChange = getPercentChange(metrics.orderCount, prevMetrics.orderCount);
  const profitChange = getPercentChange(metrics.grossProfit, prevMetrics.grossProfit);

  const prevLabel = periodo === "hoy" ? "vs ayer" : periodo === "semana" ? "vs semana anterior" : periodo === "mes" ? "vs mes anterior" : "";

  // ── Ventas por hora ─────────────────────────────────────────────────────
  const salesByHour = (() => {
    const hours: Record<number, number> = {};
    for (let h = 10; h <= 23; h++) hours[h] = 0;
    periodOrders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      if (h >= 10 && h <= 23) hours[h] = (hours[h] || 0) + o.total;
    });
    // Solo mostrar horas que tuvieron venta o están en rango 18-22
    return Object.entries(hours)
      .filter(([h, t]) => t > 0 || (parseInt(h) >= 18 && parseInt(h) <= 22))
      .map(([h, t]) => ({ hour: parseInt(h), total: t }));
  })();
  const maxHourSale = Math.max(...salesByHour.map(h => h.total), 1);

  // ── Top productos ───────────────────────────────────────────────────────
  const topProducts = (() => {
    const m: Record<string, { name: string; qty: number; revenue: number }> = {};
    periodOrders.forEach(o => o.items.forEach(item => {
      if (!m[item.product_id]) m[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      m[item.product_id].qty += item.quantity;
      m[item.product_id].revenue += item.subtotal;
    }));
    return Object.values(m).sort((a, b) => b.qty - a.qty).slice(0, 5);
  })();

  // ── Etiqueta del período ────────────────────────────────────────────────
  const periodoLabel = (() => {
    const fmt = (d: Date) => d.toLocaleDateString("es-HN", { day: "numeric", month: "short" });
    if (periodo === "hoy") return now.toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (periodo === "semana") return `Lun ${fmt(getLunesActual(now))} – Dom ${fmt(getDomingoActual(now))}`;
    if (periodo === "mes") return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("es-HN", { month: "long", year: "numeric" });
    if (periodo === "personalizado") return `${customStart} al ${customEnd}`;
    return "Histórico acumulado";
  })();

  const periodoTitulo = (() => {
    if (periodo === "hoy") return "Resumen de Hoy";
    if (periodo === "semana") return "Resumen de la Semana";
    if (periodo === "mes") return "Resumen del Mes";
    if (periodo === "personalizado") return "Resumen Personalizado";
    return "Resumen Histórico";
  })();

  const fmtL = (v: number) => `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const foodCostTarget = state.config?.food_cost_target ?? 35;

  if (!hydrated) return null;

  const periodos: { key: PeriodoKey; label: string }[] = [
    { key: "hoy", label: "Hoy" },
    { key: "semana", label: "Esta semana" },
    { key: "mes", label: "Este mes" },
    { key: "personalizado", label: "📅 Personalizado" },
    { key: "todo", label: "Histórico" },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />
        <main className="main-content-responsive">

          {/* Header */}
          <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, margin: 0 }}>{periodoTitulo}</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem", margin: 0 }}>{periodoLabel}</p>
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
              onClick={() => generateDailyReport({ date: new Date(), todayMetrics: metrics, yesterdayMetrics: prevMetrics, salesByHour, topProducts })}
              disabled={periodOrders.length === 0}
            >
              📄 Descargar Reporte PDF
            </button>
          </header>

          {/* Selector de período */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", padding: "6px", background: "var(--bg-secondary)", borderRadius: "100px", width: "fit-content", border: "1px solid var(--border-color)", marginBottom: "0.5rem" }}>
              {periodos.map(p => (
                <button key={p.key} onClick={() => setPeriodo(p.key)} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: periodo === p.key ? 700 : 600, background: periodo === p.key ? "var(--accent-color)" : "transparent", color: periodo === p.key ? "white" : "var(--text-muted)", transition: "all 150ms" }}>
                  {p.label}
                </button>
              ))}
            </div>
            {periodo === "personalizado" && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", width: "fit-content" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Desde</label>
                  <input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} className="input-field-admin" style={{ padding: "6px 10px", fontSize: "0.85rem", width: "150px" }} />
                </div>
                <span style={{ color: "var(--text-muted)", paddingBottom: "6px" }}>→</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Hasta</label>
                  <input type="date" value={customEnd} min={customStart} max={todayStr} onChange={e => setCustomEnd(e.target.value)} className="input-field-admin" style={{ padding: "6px 10px", fontSize: "0.85rem", width: "150px" }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", paddingBottom: "6px" }}>{periodOrders.length} órdenes</p>
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            
            {/* Ventas */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Ventas</h3>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", marginBottom: "0.25rem", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtL(metrics.totalSales)}</p>
              {prevLabel && <ChangeIndicator value={salesChange} suffix={prevLabel} />}
            </div>
            
            {/* Utilidad Bruta */}
            <div className="glass-panel" style={{ padding: "1.5rem", borderLeft: "3px solid #22c55e" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>💰 Utilidad Bruta</h3>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#22c55e", marginTop: "0.5rem", marginBottom: "0.25rem", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtL(metrics.grossProfit)}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Margen {metrics.marginPercent.toFixed(1)}%</p>
            </div>
            
            {/* Food Cost */}
            <div className="glass-panel" style={{ padding: "1.5rem", borderLeft: `3px solid ${metrics.foodCostPercent > foodCostTarget ? "#E8593C" : metrics.foodCostPercent > foodCostTarget * 0.85 ? "#fbbf24" : "#22c55e"}` }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>🍖 Food Cost</h3>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: metrics.foodCostPercent > foodCostTarget ? "#E8593C" : metrics.foodCostPercent > foodCostTarget * 0.85 ? "#fbbf24" : "#22c55e", marginTop: "0.5rem", marginBottom: "0.25rem" }}>
                {metrics.foodCostPercent.toFixed(1)}%
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>Costo: {fmtL(metrics.totalCost)} · Meta: ≤{foodCostTarget}%</p>
            </div>
            
            {/* Órdenes */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Órdenes</h3>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem", marginBottom: "0.25rem" }}>{metrics.orderCount}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Ticket prom. {fmtL(metrics.avgTicket)}</p>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            
            {/* Ventas por hora */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.25rem" }}>📊 Ventas por hora</h3>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 1.5rem" }}>Distribución de ingresos durante el servicio</p>
              {periodOrders.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "2rem 0" }}>Sin ventas en este período</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "160px", paddingBottom: "8px" }}>
                  {salesByHour.map(({ hour, total }) => {
                    const hPct = (total / maxHourSale) * 100;
                    return (
                      <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: total > 0 ? "var(--accent-color)" : "var(--text-muted)", marginBottom: "4px", whiteSpace: "nowrap" }}>
                          {total > 0 ? `L${total.toFixed(0)}` : "—"}
                        </span>
                        <div style={{ width: "100%", height: `${Math.max(hPct, 2)}%`, background: total > 0 ? "linear-gradient(180deg, var(--accent-color), rgba(232,89,60,0.6))" : "rgba(255,255,255,0.05)", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: "4px" }} />
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "6px" }}>
                          {hour > 12 ? `${hour-12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Top productos */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.25rem" }}>🏆 Top productos</h3>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>Los más vendidos por cantidad</p>
              {topProducts.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "2rem 0" }}>Sin ventas en este período</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topProducts.map((p, idx) => {
                    const wPct = (p.qty / topProducts[0].qty) * 100;
                    return (
                      <div key={p.name + idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx+1}.`} {p.name}
                          </span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-color)", whiteSpace: "nowrap" }}>
                            {p.qty} · {fmtL(p.revenue)}
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${wPct}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-color), rgba(232,89,60,0.5))", borderRadius: "3px", transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </AuthGuard>
  );
}
