"use client";
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

function ChangeIndicator({ 
  value, 
  suffix = "" 
}: { 
  value: number | null; 
  suffix?: string;
}) {
  if (value === null) {
    return (
      <p style={{ 
        fontSize: "0.7rem", 
        color: "var(--text-muted)",
        margin: 0
      }}>
        — sin datos previos
      </p>
    );
  }
  
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 1;
  const color = isNeutral ? "var(--text-muted)" 
    : isPositive ? "#22c55e" 
    : "#E8593C";
  const arrow = isNeutral ? "→" : isPositive ? "↑" : "↓";
  
  return (
    <p style={{ 
      fontSize: "0.7rem", 
      color, 
      margin: 0,
      fontWeight: 700
    }}>
      {arrow} {Math.abs(value).toFixed(1)}% {suffix}
    </p>
  );
}

export default function AdminDashboard() {
  const { state, signOut } = useAppState();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const ranges = getDateRanges();
  const todayOrders = filterOrdersByDateRange(
    state.orders, 
    state.orderStatuses || [], 
    ranges.todayStart, 
    ranges.todayEnd
  );
  const yesterdayOrders = filterOrdersByDateRange(
    state.orders, 
    state.orderStatuses || [], 
    ranges.yesterdayStart, 
    ranges.yesterdayEnd
  );

  const todayMetrics = calculateMetrics(
    todayOrders, 
    state.products, 
    state.ingredients
  );
  const yesterdayMetrics = calculateMetrics(
    yesterdayOrders, 
    state.products, 
    state.ingredients
  );

  const salesChange = getPercentChange(
    todayMetrics.totalSales, 
    yesterdayMetrics.totalSales
  );
  const ordersChange = getPercentChange(
    todayMetrics.orderCount, 
    yesterdayMetrics.orderCount
  );
  const profitChange = getPercentChange(
    todayMetrics.grossProfit, 
    yesterdayMetrics.grossProfit
  );

  // Ventas por hora (6pm a 10pm)
  const salesByHour = (() => {
    const hours: Record<number, number> = {};
    for (let h = 18; h <= 22; h++) hours[h] = 0;
    
    todayOrders.forEach(o => {
      const orderHour = new Date(o.created_at).getHours();
      if (orderHour >= 18 && orderHour <= 22) {
        hours[orderHour] = (hours[orderHour] || 0) + o.total;
      }
    });
    
    return Object.entries(hours).map(([hour, total]) => ({
      hour: parseInt(hour),
      total
    }));
  })();

  const maxHourSale = Math.max(...salesByHour.map(h => h.total), 1);

  // Top 5 productos más vendidos hoy
  const topProducts = (() => {
    const productMap: Record<string, { 
      name: string; 
      qty: number; 
      revenue: number 
    }> = {};
    
    todayOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = {
            name: item.product_name,
            qty: 0,
            revenue: 0
          };
        }
        productMap[item.product_id].qty += item.quantity;
        productMap[item.product_id].revenue += item.subtotal;
      });
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  })();

  if (!hydrated) return null;

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ 
                fontSize: "clamp(1.5rem, 5vw, 2rem)", 
                fontWeight: 700,
                margin: 0
              }}>
                Resumen de Hoy
              </h1>
              <p style={{ 
                color: "var(--text-muted)", 
                fontSize: "0.875rem", 
                marginTop: "0.25rem",
                marginBottom: 0
              }}>
                {new Date().toLocaleDateString("es-HN", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </div>
            <button 
              className="btn-primary" 
              style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
              onClick={() => {
                generateDailyReport({
                  date: new Date(),
                  todayMetrics,
                  yesterdayMetrics,
                  salesByHour,
                  topProducts
                });
              }}
              disabled={todayOrders.length === 0}
              title={todayOrders.length === 0 ? "No hay datos para reportar hoy" : ""}
            >
              📄 Descargar Reporte PDF
            </button>
          </header>

        {/* KPI Cards — Enfoque en control de costos */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
          gap: "1.25rem", 
          marginBottom: "2rem" 
        }}>
          
          {/* 1. VENTAS HOY */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.75rem", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              fontWeight: 700
            }}>
              Ventas Hoy
            </h3>
            <p style={{ 
              fontSize: "1.75rem", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              marginTop: "0.5rem",
              marginBottom: "0.25rem"
            }}>
              L {todayMetrics.totalSales.toFixed(2)}
            </p>
            <ChangeIndicator value={salesChange} suffix="vs ayer" />
          </div>
          
          {/* 2. UTILIDAD BRUTA */}
          <div className="glass-panel" style={{ 
            padding: "1.5rem",
            borderLeft: "3px solid #22c55e"
          }}>
            <h3 style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.75rem", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              fontWeight: 700
            }}>
              💰 Utilidad Bruta
            </h3>
            <p style={{ 
              fontSize: "1.75rem", 
              fontWeight: 800, 
              color: "#22c55e", 
              marginTop: "0.5rem",
              marginBottom: "0.25rem"
            }}>
              L {todayMetrics.grossProfit.toFixed(2)}
            </p>
            <p style={{ 
              fontSize: "0.7rem", 
              color: "var(--text-muted)",
              margin: 0
            }}>
              Margen {todayMetrics.marginPercent.toFixed(1)}%
            </p>
          </div>
          
          {/* 3. FOOD COST % */}
          <div className="glass-panel" style={{ 
            padding: "1.5rem",
            borderLeft: `3px solid ${
              todayMetrics.foodCostPercent > 35 ? "#E8593C" : 
              todayMetrics.foodCostPercent > 30 ? "#fbbf24" : 
              "#22c55e"
            }`
          }}>
            <h3 style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.75rem", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              fontWeight: 700
            }}>
              🍖 Food Cost
            </h3>
            <p style={{ 
              fontSize: "1.75rem", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              marginTop: "0.5rem",
              marginBottom: "0.25rem"
            }}>
              {todayMetrics.foodCostPercent.toFixed(1)}%
            </p>
            <p style={{ 
              fontSize: "0.7rem", 
              color: "var(--text-muted)",
              margin: 0
            }}>
              Costo: L {todayMetrics.totalCost.toFixed(2)}
            </p>
          </div>
          
          {/* 4. ÓRDENES */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.75rem", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              fontWeight: 700
            }}>
              Órdenes
            </h3>
            <p style={{ 
              fontSize: "1.75rem", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              marginTop: "0.5rem",
              marginBottom: "0.25rem"
            }}>
              {todayMetrics.orderCount}
            </p>
            <p style={{ 
              fontSize: "0.7rem", 
              color: "var(--text-muted)",
              margin: 0
            }}>
              Ticket prom. L {todayMetrics.avgTicket.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Gráficos lado a lado */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "1.25rem", 
          marginBottom: "2rem" 
        }}>
          
          {/* Ventas por hora */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.9rem", 
                fontWeight: 700, 
                color: "var(--text-primary)",
                margin: 0,
                marginBottom: "0.25rem"
              }}>
                📊 Ventas por hora
              </h3>
              <p style={{ 
                fontSize: "0.7rem", 
                color: "var(--text-muted)",
                margin: 0
              }}>
                Distribución de ingresos durante el servicio
              </p>
            </div>
            
            {todayOrders.length === 0 ? (
              <p style={{ 
                textAlign: "center", 
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                padding: "2rem 0"
              }}>
                Aún no hay ventas hoy
              </p>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "flex-end", 
                gap: "12px", 
                height: "160px",
                paddingBottom: "8px"
              }}>
                {salesByHour.map(({ hour, total }) => {
                  const heightPercent = (total / maxHourSale) * 100;
                  return (
                    <div 
                      key={hour} 
                      style={{ 
                        flex: 1, 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        justifyContent: "flex-end",
                        height: "100%"
                      }}
                    >
                      <span style={{ 
                        fontSize: "0.65rem", 
                        fontWeight: 700,
                        color: total > 0 ? "var(--accent-color)" : "var(--text-muted)",
                        marginBottom: "4px"
                      }}>
                        {total > 0 ? `L${total.toFixed(0)}` : "—"}
                      </span>
                      <div style={{ 
                        width: "100%", 
                        height: `${Math.max(heightPercent, 2)}%`, 
                        background: total > 0 
                          ? "linear-gradient(180deg, var(--accent-color), rgba(232,89,60,0.6))" 
                          : "rgba(255,255,255,0.05)",
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.4s ease",
                        minHeight: "4px"
                      }} />
                      <span style={{ 
                        fontSize: "0.7rem", 
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        marginTop: "6px"
                      }}>
                        {hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Top 5 productos */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ 
                fontSize: "0.9rem", 
                fontWeight: 700, 
                color: "var(--text-primary)",
                margin: 0,
                marginBottom: "0.25rem"
              }}>
                🏆 Top productos de la noche
              </h3>
              <p style={{ 
                fontSize: "0.7rem", 
                color: "var(--text-muted)",
                margin: 0
              }}>
                Los más vendidos hoy por cantidad
              </p>
            </div>
            
            {topProducts.length === 0 ? (
              <p style={{ 
                textAlign: "center", 
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                padding: "2rem 0"
              }}>
                Aún no hay ventas hoy
              </p>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "10px" 
              }}>
                {topProducts.map((p, idx) => {
                  const maxQty = topProducts[0].qty;
                  const widthPercent = (p.qty / maxQty) * 100;
                  return (
                    <div key={p.name + idx}>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "4px"
                      }}>
                        <span style={{ 
                          fontSize: "0.8rem", 
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "60%"
                        }}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                          {" "}{p.name}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          fontWeight: 700,
                          color: "var(--accent-color)"
                        }}>
                          {p.qty} · L{p.revenue.toFixed(0)}
                        </span>
                      </div>
                      <div style={{ 
                        width: "100%", 
                        height: "6px", 
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "3px",
                        overflow: "hidden"
                      }}>
                        <div style={{ 
                          width: `${widthPercent}%`, 
                          height: "100%", 
                          background: "linear-gradient(90deg, var(--accent-color), rgba(232,89,60,0.5))",
                          borderRadius: "3px",
                          transition: "width 0.4s ease"
                        }} />
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
