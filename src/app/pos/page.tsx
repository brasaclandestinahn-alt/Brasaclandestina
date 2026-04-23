"use client";
import { useState, useEffect } from "react";
import { Product, OrderItem } from "@/lib/mockDB";
import { useAppState } from "@/lib/useStore";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/Auth/AuthGuard";

export default function PosTerminal() {
  const { state, addOrder, getProductAvailability, signOut } = useAppState();
  
  // Hydration safety
  const [hydrated, setHydrated] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  useEffect(() => {
    setHydrated(true);
    setCurrentDate(new Date().toLocaleDateString());
  }, []);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [activeTable, setActiveTable] = useState<string>("Mesa 1");
  const [activeSeller, setActiveSeller] = useState<string>("");
  
  // Customer Info States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showCartMobile, setShowCartMobile] = useState(false);
  
  const tables = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Para Llevar", "Delivery"];

  const handleAdd = (product: Product) => {
    setCurrentOrder(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id 
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * product.price } 
          : i);
      }
      return [...prev, { 
        product_id: product.id, 
        product_name: product.name, 
        quantity: 1, 
        subtotal: product.price 
      }];
    });
  };

  const handleClear = () => setCurrentOrder([]);

  const total = currentOrder.reduce((acc, i) => acc + i.subtotal, 0);

  if (!hydrated) return null;

  return (
    <AuthGuard allowedRoles={["admin", "vendedor"]}>
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden", 
      backgroundColor: "var(--bg-primary)",
      flexDirection: "row" 
    }} className="pos-container">
      {/* Left pane: Quick Tap Menu Grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1rem", overflowY: "auto" }} className="pos-left">
        <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: 700, color: "var(--accent-color)" }}>POS Terminal</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{currentDate}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tables.slice(0, 4).map(t => (
              <button 
                key={t}
                onClick={() => setActiveTable(t)}
                style={{ 
                  padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)", 
                  backgroundColor: activeTable === t ? "var(--text-primary)" : "var(--bg-secondary)",
                  color: activeTable === t ? "var(--bg-primary)" : "var(--text-primary)",
                  border: "1px solid var(--border-color)", fontWeight: 600, fontSize: "0.8rem"
                }}
              >{t}</button>
            ))}
            <button 
                onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
                style={{ 
                  padding: "0.4rem 0.75rem", borderRadius: "var(--radius-md)", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)", fontWeight: 700, fontSize: "0.8rem"
                }}
              >Salir</button>
          </div>
        </header>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
          gap: "0.75rem" 
        }}>
          {state.products.map(product => {
            const avail = getProductAvailability(product);
            const inCart = currentOrder.find(i => i.product_id === product.id)?.quantity || 0;
            const trueAvail = avail - inCart;

            return (
              <button 
                key={product.id} className="glass-panel"
                onClick={() => handleAdd(product)}
                disabled={trueAvail <= 0}
                style={{ 
                  height: "120px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  textAlign: "center", padding: "0.75rem", opacity: trueAvail <= 0 ? 0.5 : 1, transition: "var(--transition-fast)",
                  cursor: trueAvail <= 0 ? "not-allowed" : "pointer"
                }}
              >
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-primary)" }}>{product.name}</h3>
                <p style={{ color: "var(--accent-color)", fontWeight: 800, fontSize: "1rem" }}>{formatCurrency(product.price)}</p>
                {trueAvail <= 0 ? (
                  <span style={{ fontSize: "0.65rem", color: "var(--danger)", marginTop: "0.5rem", fontWeight: 700 }}>AGOTADO</span>
                ) : inCart > 0 && (
                  <span style={{ fontSize: "0.65rem", backgroundColor: "var(--accent-color)", color: "white", padding: "2px 6px", borderRadius: "100px", marginTop: "0.5rem", fontWeight: 800 }}>{inCart} en pedido</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      <button 
        className="mobile-only"
        onClick={() => setShowCartMobile(true)}
        style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 100,
          backgroundColor: "var(--accent-color)", color: "white", width: "64px", height: "64px",
          borderRadius: "50%", border: "none", boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", cursor: "pointer"
        }}
      >
        🛒
        {currentOrder.length > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, backgroundColor: "var(--danger)", color: "white", fontSize: "0.75rem", padding: "2px 6px", borderRadius: "50%", fontWeight: 800 }}>
            {currentOrder.reduce((acc, i) => acc + i.quantity, 0)}
          </span>
        )}
      </button>

      {/* Right pane: Active Order / Bill */}
      <div 
        style={{ 
          width: "350px", 
          borderLeft: "1px solid var(--border-color)", 
          backgroundColor: "var(--bg-secondary)", 
          display: "flex", 
          flexDirection: "column",
          transition: "transform 0.3s ease-in-out"
        }} 
        className={`pos-right ${showCartMobile ? 'show' : ''}`}
      >
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Orden Activa - {activeTable}</h2>
          <button onClick={() => setShowCartMobile(false)} className="mobile-only" style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {currentOrder.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>Sin items en la orden</p>
          ) : (
            currentOrder.map((item, idx) => {
              const product = state.products.find(p => p.id === item.product_id);
              return (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>x{item.quantity}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{product?.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatCurrency(item.subtotal)}</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: "1.5rem", borderTop: "2px solid var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: 800 }}>
            <span>Total:</span>
            <span style={{ color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(total)}</span>
          </div>
          <div style={{ paddingBottom: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Cajero / Mesero Responsable:
            </label>
            <select 
              className="input-field" 
              value={activeSeller} 
              onChange={e => setActiveSeller(e.target.value)}
              style={{ padding: "0.5rem", width: "100%", borderRadius: "var(--radius-md)" }}
            >
              <option value="">-- Seleccionar Empleado --</option>
              {state.employees.filter(e => e.role === "vendedor" || e.role === "admin").map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>

          {(activeTable === "Delivery" || activeTable === "Para Llevar") && (
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", marginBottom: "1rem", border: "1px solid var(--accent-color)" }}>
               <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-color)", marginBottom: "0.5rem" }}>DATOS DE ENTREGA / CONTACTO</label>
               <input 
                 type="text" 
                 placeholder="Nombre del Cliente" 
                 className="input-field" 
                 value={customerName}
                 onChange={e => setCustomerName(e.target.value)}
                 style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}
               />
               <input 
                 type="text" 
                 placeholder="Teléfono" 
                 className="input-field" 
                 value={customerPhone}
                 onChange={e => setCustomerPhone(e.target.value)}
                 style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}
               />
               {activeTable === "Delivery" && (
                 <textarea 
                   placeholder="Dirección Completa..." 
                   className="input-field" 
                   value={customerAddress}
                   onChange={e => setCustomerAddress(e.target.value)}
                   style={{ fontSize: "0.875rem", height: "60px", resize: "none" }}
                 />
               )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <button className="btn-primary" style={{ backgroundColor: "var(--danger)" }} onClick={handleClear} disabled={currentOrder.length === 0}>Limpiar</button>
            <button className="btn-primary" disabled={currentOrder.length === 0}>Pago Rápido</button>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", backgroundColor: "var(--success)" }} 
            disabled={currentOrder.length === 0 || !activeSeller}
            onClick={() => {
              const isDelivery = activeTable === "Delivery";
              if (isDelivery && (!customerName || !customerAddress)) {
                return alert("⚠️ Faltan datos: Nombre y Dirección son obligatorios para Delivery.");
              }

              addOrder({
                id: Math.random().toString(36).substr(2, 6),
                type: isDelivery || activeTable === "Para Llevar" ? "delivery" : "mesa",
                table_number: activeTable,
                seller_id: activeSeller,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: isDelivery ? customerAddress : undefined,
                status: "pending",
                items: currentOrder,
                total: total,
                created_at: new Date().toISOString()
              });
              handleClear();
              setCustomerName("");
              setCustomerPhone("");
              setCustomerAddress("");
              alert("¡Orden capturada a nombre de " + state.employees.find(e => e.id === activeSeller)?.name + "!");
            }}
          >
            {activeSeller ? "Enviar a Cocina" : "Obligatorio: Seleccionar Cajero"}
          </button>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
