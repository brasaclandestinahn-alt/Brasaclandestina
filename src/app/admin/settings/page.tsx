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
    removeOrderStatus,
    addPaymentMethod,
    editPaymentMethod,
    removePaymentMethod,
    updateConfig 
  } = useAppState();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"sar" | "employees" | "status" | "payments" | "general">("general");

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
  
  // New payment method form state
  const [newPayLabel, setNewPayLabel] = useState("");
  const [newPayIcon, setNewPayIcon] = useState("💵");
  const [newOptionName, setNewOptionName] = useState("");
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);


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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Ventas</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Configuración</Link>
          
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
            onClick={() => setActiveTab("general")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "general" ? "var(--accent-color)" : "transparent",
              color: activeTab === "general" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Ajustes Generales
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
            Estados de Ventas
          </button>
          <button 
            onClick={() => setActiveTab("payments")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "payments" ? "var(--accent-color)" : "transparent",
              color: activeTab === "payments" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Formas de Pago
          </button>
        </div>
        
        {/* TAB 0: Ajustes Generales */}
        {activeTab === "general" && (
          <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración de la Tienda</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Activa o desactiva funciones del Menú Digital (PWA) de cara al cliente.</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Habilitar Programación de Pedidos</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Permite a los clientes agendar su entrega en intervalos de 30 minutos.</p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                  <input 
                    type="checkbox" 
                    style={{ opacity: 0, width: 0, height: 0 }}
                    checked={state.config.is_schedule_enabled}
                    onChange={(e) => updateConfig({ is_schedule_enabled: e.target.checked })}
                  />
                  <span style={{ 
                    position: 'absolute', cursor: 'pointer', inset: 0, 
                    backgroundColor: state.config.is_schedule_enabled ? 'var(--accent-color)' : '#334155', 
                    borderRadius: '34px', transition: 'var(--transition-fast)' 
                  }}>
                    <span style={{ 
                      position: 'absolute', content: '""', height: '22px', width: '22px', 
                      left: state.config.is_schedule_enabled ? '34px' : '4px', bottom: '4px',
                      backgroundColor: 'white', borderRadius: '50%', transition: 'var(--transition-fast)',
                      boxShadow: 'var(--shadow-md)'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Agregar Nuevo Estado de Venta</h2>
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

        {/* TAB 4: Formas de Pago */}
        {activeTab === "payments" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Agregar Nueva Forma de Pago</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Configura los métodos que tus clientes pueden usar para pagar sus órdenes.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newPayLabel) return alert("Indica el nombre de la forma de pago.");
                addPaymentMethod({
                  id: "pay_" + Math.random().toString(36).substr(2, 6),
                  label: newPayLabel,
                  icon: newPayIcon,
                  is_active: true
                });
                setNewPayLabel("");
              }} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                
                <div style={{ flex: 1, minWidth: "80px", maxWidth: "120px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>Icono / Emoji</label>
                  <select className="input-field" value={newPayIcon} onChange={e => setNewPayIcon(e.target.value)}>
                    <option value="💵">💵 Efectivo</option>
                    <option value="💳">💳 Tarjeta</option>
                    <option value="📲">📲 Transferencia</option>
                    <option value="🏦">🏦 Depósito</option>
                    <option value="₿">₿ Cripto</option>
                    <option value="🎁">🎁 Cupón / Regalo</option>
                  </select>
                </div>

                <div style={{ flex: 3, minWidth: "200px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.75rem" }}>Nombre del Método de Pago</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Billetera Móvil (Tigo Money)" 
                    value={newPayLabel} 
                    onChange={e => setNewPayLabel(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ padding: "0.75rem 2rem", height: "46px" }}>Agregar Método</button>
              </form>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Métodos de Pago Disponibles</h2>
            <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Método</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Estado Actual</th>
                    <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.paymentMethods || []).map((pm) => (
                    <tr key={pm.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: pm.is_active ? 1 : 0.6 }}>
                      <td style={{ padding: "1rem" }}>
                         <span style={{ fontSize: "1.25rem", marginRight: "1rem" }}>{pm.icon}</span>
                         <span style={{ fontWeight: 600 }}>{pm.label}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                         <span style={{ 
                           color: pm.is_active ? "var(--success)" : "var(--warning)", 
                           fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" 
                         }}>
                           {pm.is_active ? "● Activo" : "○ Inhabilitado"}
                         </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                         <button 
                           onClick={() => editPaymentMethod(pm.id, { is_active: !pm.is_active })}
                           style={{ background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.75rem" }}
                         >
                           {pm.is_active ? "Inhabilitar" : "Habilitar"}
                         </button>
                         <button 
                           onClick={() => {
                             if(confirm(`¿Estás seguro de quitar "${pm.label}"?`)) removePaymentMethod(pm.id);
                           }}
                           style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}
                         >
                           Quitar
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sub-options Management (e.g. Banks) */}
            <div style={{ marginTop: "3rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración de Bancos (Transferencias)</h2>
                {(() => {
                    const transMethod = state.paymentMethods.find(pm => pm.id === "transferencia");
                    if (!transMethod) return <p style={{ color: "var(--text-muted)" }}>Habilite 'Transferencia Bancaria' para configurar bancos.</p>;
                    
                    return (
                        <div className="glass-panel" style={{ padding: "2rem" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Administra los bancos disponibles para que tus clientes realicen transferencias.</p>
                            
                            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Nombre del Banco (ej: Ficohsa)" 
                                    value={newOptionName}
                                    onChange={e => setNewOptionName(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    className="btn-primary"
                                    onClick={() => {
                                        if (!newOptionName) return;
                                        const currentOptions = transMethod.options || [];
                                        editPaymentMethod(transMethod.id, { 
                                            options: [...currentOptions, { label: newOptionName, is_active: true }] 
                                        });
                                        setNewOptionName("");
                                    }}
                                >+ Agregar Banco</button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {(transMethod.options || []).map((rawOption, idx) => {
                                    // Normalización para compatibilidad con datos antiguos (strings)
                                    const option = typeof rawOption === "string" 
                                        ? { label: rawOption, is_active: true } 
                                        : rawOption;

                                    return (
                                        <div key={idx} style={{ 
                                            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                                            backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", 
                                            border: "1px solid var(--border-color)", opacity: option.is_active ? 1 : 0.6 
                                        }}>
                                        <div style={{ flex: 1 }}>
                                            {editingOptionIndex === idx ? (
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        value={option.label}
                                                        onChange={e => {
                                                            const newOptions = [...(transMethod.options || [])];
                                                            newOptions[idx] = { ...option, label: e.target.value };
                                                            editPaymentMethod(transMethod.id, { options: newOptions });
                                                        }}
                                                        autoFocus
                                                        style={{ fontWeight: 700, fontSize: "1rem" }}
                                                    />
                                                    <button 
                                                        onClick={() => setEditingOptionIndex(null)}
                                                        className="btn-primary"
                                                        style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                                    >Listo</button>
                                                </div>
                                            ) : (
                                                <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>{option.label}</span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                            {editingOptionIndex !== idx && (
                                                <button 
                                                    onClick={() => setEditingOptionIndex(idx)}
                                                    style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem" }}
                                                    title="Editar nombre"
                                                >✏️</button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    const newOptions = [...(transMethod.options || [])];
                                                    const currentOpt = typeof rawOption === "string" ? { label: rawOption, is_active: true } : rawOption;
                                                    newOptions[idx] = { ...currentOpt, is_active: !currentOpt.is_active };
                                                    editPaymentMethod(transMethod.id, { options: newOptions });
                                                }}
                                                style={{ 
                                                    background: option.is_active ? "var(--bg-primary)" : "var(--accent-color)", 
                                                    color: option.is_active ? "var(--text-primary)" : "white",
                                                    border: "1px solid var(--border-color)", padding: "0.4rem 0.8rem", 
                                                    borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600
                                                }}
                                            >
                                                {option.is_active ? "Inhabilitar" : "Habilitar"}
                                            </button>
                                            
                                            <button 
                                                onClick={() => {
                                                    if(confirm(`¿Deseas eliminar "${option.label}"?`)) {
                                                        const newOptions = transMethod.options?.filter((_, i) => i !== idx);
                                                        editPaymentMethod(transMethod.id, { options: newOptions });
                                                    }
                                                }}
                                                style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "0.5rem" }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
      </div>
    )}

      </main>
    </div>
  );
}
