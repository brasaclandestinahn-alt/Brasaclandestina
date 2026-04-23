"use client";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { Role, OrderStatusCategory, MOCK_CONFIG } from "@/lib/mockDB";
import Sidebar from "@/components/Admin/Sidebar";

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
    updateConfig,
    signOut
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

  const config = state.config || MOCK_CONFIG;

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
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Ajustes y Configuración</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Panel centralizado para administrar el sistema tributario y el talento humano de tu negocio.</p>
          </header>

          {/* Pill Tabs Navigation */}
          <div style={{ 
            display: "flex", 
            gap: "0.5rem", 
            marginBottom: "2rem", 
            backgroundColor: "var(--bg-secondary)", 
            padding: "0.5rem", 
            borderRadius: "var(--radius-lg)", 
            width: "100%",
            overflowX: "auto",
            border: "1px solid var(--border-color)",
            whiteSpace: "nowrap",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}>
            <button onClick={() => setActiveTab("general")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "general" ? "var(--accent-color)" : "transparent", color: activeTab === "general" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>⚙️ General</button>
            <button onClick={() => setActiveTab("sar")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "sar" ? "var(--accent-color)" : "transparent", color: activeTab === "sar" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>📋 SAR/Fiscal</button>
            <button onClick={() => setActiveTab("employees")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "employees" ? "var(--accent-color)" : "transparent", color: activeTab === "employees" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>👥 Empleados</button>
            <button onClick={() => setActiveTab("status")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "status" ? "var(--accent-color)" : "transparent", color: activeTab === "status" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>🕒 Estados</button>
            <button onClick={() => setActiveTab("payments")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "payments" ? "var(--accent-color)" : "transparent", color: activeTab === "payments" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>💳 Pagos</button>
          </div>
        
        {/* TAB 0: Ajustes Generales */}
        {activeTab === "general" && (
          <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración de la Tienda</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Activa o desactiva funciones del Menú Digital (PWA) de cara al cliente.</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Habilitar Programación de Pedidos</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Permite a los clientes agendar su entrega en intervalos de 30 minutos.</p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                  <input 
                    type="checkbox" 
                    style={{ opacity: 0, width: 0, height: 0 }}
                    checked={config.is_schedule_enabled}
                    onChange={(e) => updateConfig({ is_schedule_enabled: e.target.checked })}
                  />
                  <span style={{ 
                    position: 'absolute', cursor: 'pointer', inset: 0, 
                    backgroundColor: config.is_schedule_enabled ? 'var(--accent-color)' : '#334155', 
                    borderRadius: '34px', transition: 'var(--transition-fast)' 
                  }}>
                    <span style={{ 
                      position: 'absolute', content: '""', height: '22px', width: '22px', 
                      left: config.is_schedule_enabled ? '34px' : '4px', bottom: '4px',
                      backgroundColor: 'white', borderRadius: '50%', transition: 'var(--transition-fast)',
                      boxShadow: 'var(--shadow-md)'
                    }} />
                  </span>
                </label>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--accent-red)" }}>Canales de Venta y Enlaces</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>NÚMERO DE WHATSAPP</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.whatsapp_number || ""} 
                    onChange={e => updateConfig({ whatsapp_number: e.target.value })}
                    placeholder="+504 0000-0000"
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>MENSAJE PREDETERMINADO</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.whatsapp_message || ""} 
                    onChange={e => updateConfig({ whatsapp_message: e.target.value })}
                    placeholder="Hola, quiero hacer un pedido..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE RAPPI</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.rappi_link || ""} 
                    onChange={e => updateConfig({ rappi_link: e.target.value })}
                    placeholder="https://www.rappi.com.hn/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE UBER EATS</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.ubereats_link || ""} 
                    onChange={e => updateConfig({ ubereats_link: e.target.value })}
                    placeholder="https://www.ubereats.com/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE PEDIDOSYA</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.pedidosya_link || ""} 
                    onChange={e => updateConfig({ pedidosya_link: e.target.value })}
                    placeholder="https://www.pedidosya.com.hn/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE INSTAGRAM</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.instagram_link || ""} 
                    onChange={e => updateConfig({ instagram_link: e.target.value })}
                    placeholder="https://www.instagram.com/..."
                  />
                </div>
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
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>PIN (4 dgt)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    className="input-field" 
                    placeholder="1234"
                    value={empPin} 
                    onChange={e => setEmpPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">Registrar</button>
              </form>
            </div>

            {/* Lista de Empleados */}
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Equipo Activo</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <th style={{ padding: "1rem" }}>NOMBRE</th>
                    <th style={{ padding: "1rem" }}>ROL</th>
                    <th style={{ padding: "1rem" }}>PIN</th>
                    <th style={{ padding: "1rem" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {state.employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.95rem" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{emp.name}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ 
                          padding: "0.25rem 0.75rem", 
                          borderRadius: "100px", 
                          fontSize: "0.75rem", 
                          fontWeight: 700,
                          backgroundColor: emp.role === "admin" ? "#fef3c7" : "#f1f5f9",
                          color: emp.role === "admin" ? "#92400e" : "#475569"
                        }}>
                          {emp.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "monospace" }}>****</td>
                      <td style={{ padding: "1rem" }}>
                        <button style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Estados de Pedido */}
        {activeTab === "status" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Configurar Flujo de Trabajo</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>Crea estados personalizados para que tus pedidos fluyan por el KDS y el Delivery de forma ordenada.</p>
              
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Etiqueta (Label)</label>
                  <input type="text" className="input-field" placeholder="Ej. Empacando" value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Módulo Destino</label>
                  <select className="input-field" value={newStatusCategory} onChange={e => setNewStatusCategory(e.target.value as OrderStatusCategory)}>
                    <option value="initial">Pantalla Inicial / Caja</option>
                    <option value="kitchen">KDS (Pantalla de Cocina)</option>
                    <option value="transit">Repartidor (En Camino)</option>
                    <option value="done">Completados / Historial</option>
                  </select>
                </div>
                <div style={{ width: "60px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Color</label>
                  <input type="color" className="input-field" style={{ padding: "0", height: "42px" }} value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} />
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    if (!newStatusLabel) return alert("Ponle un nombre al estado.");
                    addOrderStatus({
                      id: newStatusLabel.toLowerCase().replace(/\s+/g, '_'),
                      label: newStatusLabel,
                      color: newStatusColor,
                      category: newStatusCategory,
                      order: state.orderStatuses.length + 1
                    });
                    setNewStatusLabel("");
                  }}
                >+ Agregar</button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Mapa de Estados Actual</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {state.orderStatuses.sort((a, b) => a.order - b.order).map((status) => (
                        <div key={status.id} style={{ 
                            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                            backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", 
                            border: "1px solid var(--border-color)", borderLeft: `5px solid ${status.color}`
                        }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: 700 }}>{status.label}</h4>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Modulo: {status.category}</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button style={{ background: "none", border: "none", cursor: "pointer" }}>✏️</button>
                                <button 
                                    onClick={() => removeOrderStatus(status.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer" }}
                                >🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* TAB 4: Métodos de Pago */}
        {activeTab === "payments" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Habilitar Métodos de Cobro</h2>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ width: "60px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Icono</label>
                  <input type="text" className="input-field" value={newPayIcon} onChange={e => setNewPayIcon(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Nombre del Método</label>
                  <input type="text" className="input-field" placeholder="Ej. Bitcoin" value={newPayLabel} onChange={e => setNewPayLabel(e.target.value)} />
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    if (!newPayLabel) return;
                    addPaymentMethod({
                        id: newPayLabel.toLowerCase().replace(/\s+/g, '_'),
                        label: newPayLabel,
                        icon: newPayIcon,
                        is_active: true
                    });
                    setNewPayLabel("");
                  }}
                >+ Habilitar</button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Pasarelas Activas</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <th style={{ padding: "1rem" }}>METODO</th>
                    <th style={{ padding: "1rem" }}>ESTADO</th>
                    <th style={{ padding: "1rem" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {state.paymentMethods.map(pm => (
                    <tr key={pm.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: pm.is_active ? 1 : 0.6 }}>
                      <td style={{ padding: "1rem", fontWeight: 700 }}>{pm.icon} {pm.label}</td>
                      <td style={{ padding: "1rem" }}>{pm.is_active ? "Activo" : "Pausado"}</td>
                      <td style={{ padding: "1rem" }}>
                        <button 
                            onClick={() => editPaymentMethod(pm.id, { is_active: !pm.is_active })}
                            style={{ color: "var(--accent-color)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                            {pm.is_active ? "Pausar" : "Reanudar"}
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
                                                    const newOptions = (transMethod.options || []).filter((_, i) => i !== idx);
                                                    editPaymentMethod(transMethod.id, { options: newOptions });
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                                                title="Eliminar banco"
                                            >🗑️</button>
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

          <div style={{ marginTop: "4rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem", textAlign: "center" }}>
             <button onClick={signOut} className="btn-primary" style={{ backgroundColor: "transparent", border: "1px solid #ef4444", color: "#ef4444" }}>
                Cerrar Sesión de Administrador
             </button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
