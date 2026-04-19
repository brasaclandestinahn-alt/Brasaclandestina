"use client";
import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";
import { Role, OrderStatusCategory } from "@/lib/mockDB";

export default function SettingsDashboard() {
  const { 
    state, 
    hydrated, 
    addEmployee, 
    addOrderStatus, 
    editOrderStatus, 
    removeOrderStatus 
  } = useAppState();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"sar" | "employees" | "status">("sar");

  // SAR Form State
  const [cai, setCai] = useState("000-001-01-00000000");
  const [rangoInicial, setRangoInicial] = useState("000-001-01-00000001");
  const [rangoFinal, setRangoFinal] = useState("000-001-01-00001000");
  const [fechaLimite, setFechaLimite] = useState("2026-12-31");
  const [isSaved, setIsSaved] = useState(false);

  // New employee form state
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState<Role>("vendedor");
  const [empPin, setEmpPin] = useState("");
  // New status form state
  const [newStatusId, setNewStatusId] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#f59e0b");
  const [newStatusCategory, setNewStatusCategory] = useState<OrderStatusCategory>("initial");


  if (!hydrated) return null;

  const handleSaveSAR = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empRole || !empPin) return alert("Faltan datos.");
    if (empPin.length < 4) return alert("El PIN debe tener al menos 4 dígitos para seguridad.");
    
    addEmployee({
      id: "e_" + Math.random().toString(36).substr(2, 6),
      name: empName,
      role: empRole,
      pin: empPin
    });
    
    setEmpName("");
    setEmpPin("");
    alert("Empleado registrado exitosamente.");
  };

  return (
  const menuItems = [
    { label: "Menu BC", icon: "📖", href: "/admin" },
    { label: "Control de pedidos", icon: "📋", href: "/admin/orders" },
    { label: "Gestión de Precios", icon: "💰", href: "/admin/pricing" },
    { label: "Inventario", icon: "🍴", href: "/admin/inventory" },
    { label: "Ventas", icon: "📈", href: "/admin/finances" },
    { label: "Envíos", icon: "🛵", href: "/admin/orders" },
    { label: "Configuración", icon: "⚙️", href: "/admin/settings", active: true }
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
                <span>⚙️</span> CONFIGURACIÓN
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
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Ajustes y Configuración</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Panel centralizado para administrar el sistema tributario y el talento humano de tu negocio.</p>
        </header>

        {/* Pill Tabs Navigation */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-secondary)", padding: "0.5rem", borderRadius: "100px", width: "fit-content", border: "1px solid var(--border-color)" }}>
          <button 
            onClick={() => setActiveTab("sar")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "sar" ? "var(--accent-color)" : "transparent",
              color: activeTab === "sar" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Configuración SAR
          </button>
          <button 
            onClick={() => setActiveTab("employees")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "employees" ? "var(--accent-color)" : "transparent",
              color: activeTab === "employees" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Empleados / Vendedores
          </button>
          <button 
            onClick={() => setActiveTab("status")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "status" ? "var(--accent-color)" : "transparent",
              color: activeTab === "status" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Estados de Pedido
          </button>
        </div>

        {/* TAB 1: Configuración SAR */}
        {activeTab === "sar" && (
          <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease-in-out" }}>
            <form onSubmit={handleSaveSAR} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Clave de Autorización de Impresión (CAI)</label>
                <input 
                  type="text" 
                  value={cai}
                  onChange={(e) => setCai(e.target.value)}
                  className="input-field" 
                  style={{ fontFamily: "monospace", letterSpacing: "1px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rango Inicial Autorizado</label>
                  <input 
                    type="text" 
                    value={rangoInicial}
                    onChange={(e) => setRangoInicial(e.target.value)}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rango Final Autorizado</label>
                  <input 
                    type="text" 
                    value={rangoFinal}
                    onChange={(e) => setRangoFinal(e.target.value)}
                    className="input-field" 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Fecha Límite de Emisión</label>
                <input 
                  type="date" 
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="input-field" 
                />
              </div>

              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="submit" className="btn-primary">
                  Actualizar Credenciales Fiscales
                </button>
                {isSaved && <span style={{ color: "var(--success)", fontWeight: 600 }}>¡Configuración Guardada!</span>}
              </div>
            </form>

            <div className="glass-panel" style={{ padding: "2rem", marginTop: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Libro de Ventas Diarias</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>Exporta el reporte en formato CSV validado para la declaración en línea del SAR.</p>
              <button className="btn-primary" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                📥 Exportar Libro de Ventas (CSV)
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Empleados / Vendedores */}
        {activeTab === "employees" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            {/* Alta de Empleado */}
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Reclutar Especialista</h2>
              <form onSubmit={handleAddEmployee} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 2, minWidth: "200px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre Completo</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. María López"
                    value={empName} 
                    onChange={e => setEmpName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rol Operativo</label>
                  <select className="input-field" value={empRole} onChange={e => setEmpRole(e.target.value as Role)} required>
                    <option value="vendedor">Mesero / Cajero</option>
                    <option value="repartidor">Repartidor (Delivery)</option>
                    <option value="cocinero">Staff de Cocina</option>
                    <option value="admin">Súper Admin</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "130px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>PIN (Clave)</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="****"
                    value={empPin} 
                    onChange={e => setEmpPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "0.75rem 2rem", height: "100%" }}>
                  Registrar Personal
                </button>
              </form>
            </div>

            {/* Analítica de Vendedores */}
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Rendimiento Financiero (Vendedores y Admins)</h2>
            <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "3rem" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Cajero / Vendedor</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Órdenes Atendidas</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Total Ingresado (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {state.employees.filter(e => e.role === "vendedor" || e.role === "admin").map((emp, idx) => {
                    const empOrders = state.orders.filter(o => o.seller_id === emp.id);
                    const empTotal = empOrders.reduce((acc, o) => acc + o.total, 0);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>{emp.name}</td>
                        <td style={{ padding: "1rem", color: "var(--text-muted)" }}>{empOrders.length} tickets cerrados</td>
                        <td style={{ padding: "1rem", color: "var(--success)", fontWeight: 700 }}>L {empTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Flota Logística (Repartidores) */}
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Flota de Repartidores Activos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {state.employees.filter(e => e.role === "repartidor").map((driver) => (
                    <div key={driver.id} className="glass-panel" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-color)" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{driver.name}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Identificador: {driver.id}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Estados de Pedido */}
        {activeTab === "status" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Agregar Nuevo Estado de Pedido</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Crea estados personalizados para rastrear operaciones. Asigna una "Fase Operativa" para que el sistema sepa si enviarlo a Cocina, a Repartidores, o archivar el ticket.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newStatusId || !newStatusLabel) return alert("Completa el ID y el Nombre.");
                if (state.orderStatuses.find(s => s.id === newStatusId)) return alert("Ese ID Interno ya existe. Usa código único.");
                addOrderStatus({
                  id: newStatusId,
                  label: newStatusLabel,
                  color: newStatusColor,
                  category: newStatusCategory,
                  order: state.orderStatuses.length + 1
                });
                setNewStatusId("");
                setNewStatusLabel("");
              }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>ID Técnico (ej: en_horno)</label>
                  <input type="text" className="input-field" placeholder="mi_estado" value={newStatusId} onChange={e => setNewStatusId(e.target.value.toLowerCase().replace(/\s/g, '_'))} required />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>Nombre Visual</label>
                  <input type="text" className="input-field" placeholder="Ej. Empacando Caja" value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} required />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>Fase Operativa</label>
                  <select className="input-field" value={newStatusCategory} onChange={e => setNewStatusCategory(e.target.value as any)} required>
                    <option value="initial">Inicial (Caja)</option>
                    <option value="kitchen">Cocina (KDS)</option>
                    <option value="transit">Tránsito / Repartidor</option>
                    <option value="done">Completado / Historial</option>
                    <option value="cancelled">Cancelado / Abortado (Devuelve Inventario)</option>
                  </select>
                </div>
                
                <div style={{ maxWidth: "100px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>Color</label>
                  <input type="color" className="input-field" value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} style={{ padding: "0.25rem", height: "46px" }} />
                </div>

                <button type="submit" className="btn-primary" style={{ padding: "0.75rem 2rem", height: "46px" }}>Guardar</button>
              </form>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Estados Actuales (Configurados)</h2>
            <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Vista Previa</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>ID Interno</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Fase (Módulo)</th>
                    <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(state.orderStatuses || [])].sort((a,b) => a.order - b.order).map((statusObj) => {
                    const isInUse = state.orders.some(o => o.status === statusObj.id);
                    return (
                      <tr key={statusObj.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem" }}>
                           <span style={{ padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: statusObj.color.startsWith('var(') ? statusObj.color : `${statusObj.color}20`, color: statusObj.color.startsWith('var(') ? 'white' : statusObj.color, border: statusObj.color.startsWith('var(') ? 'none' : `1px solid ${statusObj.color}` }}>
                             {statusObj.label}
                           </span>
                        </td>
                        <td style={{ padding: "1rem", fontFamily: "monospace", color: "var(--text-muted)", fontSize: "0.875rem" }}>{statusObj.id}</td>
                        <td style={{ padding: "1rem" }}>
                           {statusObj.category === "initial" && "Caja"}
                           {statusObj.category === "kitchen" && "🍽️ KDS Cocina"}
                           {statusObj.category === "transit" && "🛵 Reparto"}
                           {statusObj.category === "done" && "✅ Completado"}
                           {statusObj.category === "cancelled" && "❌ Cancelado / Devuelto"}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                           <button 
                             style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: 600, opacity: isInUse ? 0.3 : 1 }}
                             disabled={isInUse}
                             title={isInUse ? "No se puede eliminar porque hay órdenes activas usando este estado." : "Eliminar"}
                             onClick={() => removeOrderStatus(statusObj.id)}
                           >
                             {isInUse ? "Bloqueado" : "Eliminar"}
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
