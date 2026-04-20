"use client";
import { useState, useEffect } from "react";
import { Product, Order, Ingredient, OrderStatusConfig } from "@/lib/mockDB";

interface ProfitDistributionModuleProps {
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  orderStatuses: OrderStatusConfig[];
}

export default function ProfitDistributionModule({ orders = [], products = [], ingredients = [], orderStatuses = [] }: ProfitDistributionModuleProps) {
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [partners, setPartners] = useState<{id: string, name: string, percent: number}[]>([]);

  // 1. Safe Hydration and LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("brasa_partners_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPartners(parsed);
      }
      setHydrated(true);
    } catch (e) {
      console.error("Error hydrating partners:", e);
      setHydrated(true); // Still hydrate to show the module even if storage fails
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem("brasa_partners_v3", JSON.stringify(partners));
      } catch (e) {
        console.error("Error saving partners:", e);
      }
    }
  }, [partners, hydrated]);

  if (!hydrated) return null;

  try {
    // 2. Robust Weekly Range Logic
    const getWeeklyRange = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday
      // Adjust to Monday: if Sunday (0) -> -6, if Mon (1) -> 0, if Tue (2) -> -1...
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      
      const mon = new Date(now);
      mon.setHours(0, 0, 0, 0);
      mon.setDate(now.getDate() + diffToMonday);
      
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);
      
      return { mon, sun };
    };

    const { mon, sun } = getWeeklyRange();

    // 3. Financial Calculations
    const validOrders = (orders || []).filter(o => {
      const status = (orderStatuses || []).find(s => s.id === o.status);
      return status?.category !== "cancelled";
    });

    const weeklyOrders = validOrders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d >= mon && d <= sun;
    });

    const weeklyRevenue = weeklyOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    
    let weeklyCogs = 0;
    weeklyOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product?.recipe) {
          product.recipe.forEach(rec => {
            const ing = ingredients.find(i => i.id === rec.ingredient_id);
            if (ing) weeklyCogs += item.quantity * rec.quantity * ing.cost_per_unit;
          });
        }
      });
    });

    const netProfit = weeklyRevenue - weeklyCogs;
    const totalPercent = partners.reduce((acc, p) => acc + (p.percent || 0), 0);

    // 4. Partner Handlers
    const addPartner = () => setPartners([...partners, { id: Math.random().toString(36).substr(2, 5), name: "Nuevo Socio", percent: 0 }]);
    const removePartner = (id: string) => setPartners(partners.filter(p => p.id !== id));
    const updatePartner = (id: string, f: string, v: any) => setPartners(partners.map(p => p.id === id ? { ...p, [f]: v } : p));

    return (
      <div className="glass-panel" style={{ flex: 1, minWidth: "400px", padding: "2rem", borderLeft: "4px solid var(--accent-color)", marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-color)" }}>📊 Distribución de Utilidades</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Periodo Semanal: {mon.toLocaleDateString()} al {sun.toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={addPartner}
            style={{ padding: "0.5rem 1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontWeight: 700, cursor: "pointer" }}
          >
            + Añadir Socio
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
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
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--success)" }}>L {netProfit.toFixed(2)}</p>
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
                L {((netProfit * (p.percent || 0)) / 100).toFixed(2)}
              </div>
              <button 
                onClick={() => removePartner(p.id)} 
                style={{ padding: "4px", background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >🗑️</button>
            </div>
          ))}
          
          {partners.length > 0 && (
            <div style={{ marginTop: "1rem", padding: "1rem", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontWeight: 700, color: totalPercent > 100 ? "var(--danger)" : "var(--text-muted)" }}>
                {totalPercent > 100 ? "⚠️ LA SUMA SUPERA EL 100%" : `Suma: ${totalPercent}%`}
              </span>
              <span style={{ fontWeight: 800 }}>Repartido: L {((netProfit * totalPercent) / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    );
  } catch (e) {
    console.error("ProfitDistributionModule render error:", e);
    return (
      <div className="glass-panel" style={{ padding: "2rem", marginTop: "2rem", border: "1px solid var(--danger)" }}>
        <p style={{ color: "var(--danger)", fontWeight: 700 }}>⚠️ El módulo de utilidades no pudo cargarse debido a un error de datos.</p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>El resto de tus finanzas se muestran correctamente.</p>
      </div>
    );
  }
}
