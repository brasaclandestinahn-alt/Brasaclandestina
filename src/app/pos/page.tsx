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
        product_name: product.name, // Captura de nombre para inmutabilidad
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      {/* Left pane: Quick Tap Menu Grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-color)" }}>POS Terminal</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{currentDate}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {tables.slice(0, 4).map(t => (
              <button 
                key={t}
                onClick={() => setActiveTable(t)}
                style={{ 
                  padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", 
                  backgroundColor: activeTable === t ? "var(--text-primary)" : "var(--bg-secondary)",
                  color: activeTable === t ? "var(--bg-primary)" : "var(--text-primary)",
                  border: "1px solid var(--border-color)", fontWeight: 600
                }}
              >{t}</button>
            ))}
            <button 
                onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
                style={{ 
                  padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)", fontWeight: 700
                }}
              >❌ Salir</button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
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
                  height: "140px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  textAlign: "center", padding: "1rem", opacity: trueAvail <= 0 ? 0.5 : 1, transition: "var(--transition-fast)"
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{product.name}</h3>
                <p style={{ color: "var(--accent-color)", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCurrency(product.price)}</p>
                {trueAvail <= 0 && <span style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.5rem" }}>Agotado</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right pane: Active Order / Bill */}
      <div style={{ width: "350px", borderLeft: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Orden Activa - {activeTable}</h2>
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
