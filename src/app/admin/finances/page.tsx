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
  // Filtrar solo las ordenes no canceladas con validaciones de seguridad
  const validOrders = (state.orders || []).filter(o => {
    if (!o) return false;
    const statusObj = (state.orderStatuses || []).find(s => s.id === o.status);
    return statusObj?.category !== "cancelled";
  });

  // --- LÓGICA SEMANAL (Lunes a Domingo) ---
  const getWeeklyRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) a 6 (Sab)
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    
    const monday = new Date(now);
    monday.setHours(0,0,0,0);
    monday.setDate(now.getDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    
    return { monday, sunday };
  };

  const { monday, sunday } = getWeeklyRange();

  const weeklyOrders = validOrders.filter(o => {
    if (!o.created_at) return false;
    const orderDate = new Date(o.created_at);
    return orderDate >= monday && orderDate <= sunday;
  });

  const weeklyRevenue = weeklyOrders.reduce((acc, o) => acc + o.total, 0);
  let weeklyCogs = 0;
  weeklyOrders.forEach(order => {
    order.items.forEach(item => {
      const product = state.products.find(p => p.id === item.product_id);
      if (product?.recipe) {
        product.recipe.forEach(rec => {
          const ing = state.ingredients.find(i => i.id === rec.ingredient_id);
          if (ing) weeklyCogs += item.quantity * rec.quantity * ing.cost_per_unit;
        });
      }
    });
  });
  const weeklyNetProfit = weeklyRevenue - weeklyCogs;

  // --- GESTIÓN DE SOCIOS ---
  const [partners, setPartners] = useState<{id: string, name: string, percent: number}[]>([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("brasa_partners");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPartners(parsed);
      }
    } catch (e) {
      console.error("Error loading partners", e);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("brasa_partners", JSON.stringify(partners));
  }, [partners, hydrated]);

  const addPartner = () => {
    const newPartner = { id: Math.random().toString(36).substr(2, 5), name: "Nuevo Socio", percent: 0 };
    setPartners([...partners, newPartner]);
  };

  const updatePartner = (id: string, field: string, value: any) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePartner = (id: string) => {
    setPartners(partners.filter(p => p.id !== id));
  };

  const totalPercent = partners.reduce((acc, p) => acc + p.percent, 0);


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

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start", marginBottom: "3rem" }}>
          {/* Distribución de Utilidades (Nueva Sección Solicitada) */}
          <div className="glass-panel" style={{ flex: 1, minWidth: "400px", padding: "2rem", borderLeft: "4px solid var(--accent-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)" }}>📊 Distribución de Utilidades</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Semana: {monday.toLocaleDateString()} al {sunday.toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={addPartner}
                style={{ padding: "0.5rem 1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontWeight: 700, cursor: "pointer" }}
              >
                + Añadir Socio
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>VENTAS SEMANA</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>L {weeklyRevenue.toFixed(2)}</p>
              </div>
              <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>COSTOS (COGS)</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>L {weeklyCogs.toFixed(2)}</p>
              </div>
              <div style={{ padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid var(--success)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)" }}>UTILIDAD NETA</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>L {weeklyNetProfit.toFixed(2)}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {partners.map(p => (
                <div key={p.id} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  <input 
                    type="text" 
                    value={p.name} 
                    onChange={(e) => updatePartner(p.id, "name", e.target.value)}
                    style={{ flex: 2, background: "transparent", border: "none", borderBottom: "1px dashed var(--border-color)", color: "white", padding: "4px", fontSize: "1rem", fontWeight: 600 }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                    <input 
                      type="number" 
                      value={p.percent} 
                      onChange={(e) => updatePartner(p.id, "percent", parseFloat(e.target.value) || 0)}
                      style={{ width: "60px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "white", padding: "4px", textAlign: "center", fontWeight: 700 }}
                    />
                    <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>%</span>
                  </div>
                  <div style={{ flex: 2, textAlign: "right", fontWeight: 800, color: "var(--accent-color)", fontSize: "1.1rem" }}>
                    L {((weeklyNetProfit * p.percent) / 100).toFixed(2)}
                  </div>
                  <button onClick={() => removePartner(p.id)} style={{ padding: "4px", background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>🗑️</button>
                </div>
              ))}
              
              {partners.length > 0 && (
                <div style={{ marginTop: "1rem", padding: "1rem", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color)" }}>
                  <span style={{ fontWeight: 700, color: totalPercent > 100 ? "var(--danger)" : "var(--text-muted)" }}>
                    {totalPercent > 100 ? "⚠️ LA SUMA SUPERA EL 100%" : `Suma de Participación: ${totalPercent}%`}
                  </span>
                  <span style={{ fontWeight: 800 }}>Total Distribuido: L {((weeklyNetProfit * totalPercent) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
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
