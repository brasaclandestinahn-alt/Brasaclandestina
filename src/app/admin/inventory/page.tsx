"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";

export default function InventoryDashboard() {
  const { state, hydrated, updateIngredientStock, editProduct, addIngredient, editIngredient, removeIngredient, addCategory, removeCategory, updateCategory, addIngredientGroup, removeIngredientGroup, updateIngredientGroup, signOut } = useAppState();
  
  // Stock Form State
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [addedQty, setAddedQty] = useState<number>(0);
  const [addedCost, setAddedCost] = useState<number | "">("");

  // New Ingredient Add Form State
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState<"g" | "ml" | "u">("u");
  const [newIngCost, setNewIngCost] = useState<number>(0);
  const [newIngGroup, setNewIngGroup] = useState("");

  // Edit Ingredient State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editStock, setEditStock] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<"g" | "ml" | "u">("u");
  const [editGroup, setEditGroup] = useState<string>("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"stock" | "management" | "kardex" | "groups">("stock");

  // Category Manager State
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{old: string, new: string} | null>(null);

  // Ingredient Group Manager State
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<{old: string, new: string} | null>(null);

  if (!hydrated) return null;

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || addedQty <= 0) return;

    const ing = state.ingredients.find(i => i.id === selectedIngredient);
    if (!ing) return;

    // Actualizar costo automáticamente si el usuario lo modificó en la UI de Entrada Logística
    if (addedCost !== "" && Number(addedCost) !== ing.cost_per_unit) {
       editIngredient(selectedIngredient, { cost_per_unit: Number(addedCost) });
    }

    updateIngredientStock(selectedIngredient, addedQty);
    setAddedQty(0);
    setSelectedIngredient("");
    setAddedCost("");
  };

  const handleAddNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName || newIngCost <= 0) return alert("Nombre y Costo Mayor a 0 requeridos.");
    addIngredient({
      id: "i_" + Math.random().toString(36).substr(2, 6),
      name: newIngName,
      unit: newIngUnit,
      cost_per_unit: newIngCost,
      group: newIngGroup || "Varios",
      stock: 0
    });
    setNewIngName("");
    setNewIngCost(0);
    setNewIngGroup("");
    alert("¡Nuevo insumo agregado al catálogo maestros!");
  };

  const handleSaveEdit = (id: string) => {
    editIngredient(id, { 
      name: editName, 
      cost_per_unit: editCost, 
      stock: editStock, 
      unit: editUnit,
      group: editGroup
    });
    setEditingId(null);
    alert("¡Insumo actualizado en su totalidad!");
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro/a que deseas ELIMINAR permanentemente el insumo: ${name}?\n\nEsta acción podría impactar a los platillos que dependen de él.`)) {
      removeIngredient(id);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Ventas</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/expenses" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Gastos</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Configuración</Link>
          
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>Módulos Operativos</div>
          <Link href="/pos" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Terminal de Ventas (POS)</Link>
          <Link href="/kds" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Pantalla de Cocina (KDS)</Link>
          <Link href="/delivery" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>App Repartidores</Link>
          
          <Link href="/" target="_blank" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)", border: "1px dashed var(--border-color)" }}>Ver Menú Digital (PWA)</Link>
          
          <button 
            onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(); }}
            style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--danger)", border: "none", background: "rgba(239, 68, 68, 0.05)", fontWeight: 700, cursor: "pointer", textAlign: "left", marginTop: "1rem" }}
          >
            ❌ Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Inventario y Recetas (BOM)</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Control de materia prima. Estos componentes definen la disponibilidad real de los platillos del Menú.</p>
        </header>

        {/* Pill Tabs Navigation */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-secondary)", padding: "0.5rem", borderRadius: "100px", width: "fit-content", border: "1px solid var(--border-color)" }}>
          <button 
            onClick={() => setActiveTab("stock")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "stock" ? "var(--accent-color)" : "transparent",
              color: activeTab === "stock" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Inventario Actual
          </button>
          <button 
            onClick={() => setActiveTab("management")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "management" ? "var(--accent-color)" : "transparent",
              color: activeTab === "management" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Gestión y Entradas
          </button>
          <button 
            onClick={() => setActiveTab("kardex")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "kardex" ? "var(--accent-color)" : "transparent",
              color: activeTab === "kardex" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Kardex (Historial de Flujo)
          </button>
          <button 
            onClick={() => setActiveTab("groups")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "groups" ? "var(--accent-color)" : "transparent",
              color: activeTab === "groups" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Grupos de Insumos
          </button>
        </div>

        {/* TAB 1: GESTION DE ENTRADAS (Forms) */}
        {activeTab === "management" && (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "3rem", animation: "fadeIn 0.3s ease-in-out" }}>
            {/* Formulario Ingreso de Stock */}
            <div className="glass-panel" style={{ padding: "2rem", flex: 1, minWidth: "350px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Añadir Cantidad a Existente</h2>
              <form onSubmit={handleAddStock} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 2, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Insumo</label>
                  <select 
                    className="input-field" 
                    value={selectedIngredient} 
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedIngredient(id);
                      if (id) {
                         const ing = state.ingredients.find(i => i.id === id);
                         if (ing) setAddedCost(ing.cost_per_unit);
                      } else {
                         setAddedCost("");
                      }
                    }}
                    required
                  >
                    <option value="">-- Seleccionar Insumo --</option>
                    {state.ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Costo Actual (L)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={addedCost} 
                    onChange={e => setAddedCost(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Auto"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Cantidad (+)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={addedQty || ""} 
                    onChange={e => setAddedQty(Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "0.75rem 2rem", width: "100%" }}>
                  Registrar Entrada Logística
                </button>
              </form>
            </div>

            {/* Formulario Nuevo Insumo */}
            <div className="glass-panel" style={{ padding: "2rem", flex: 1, minWidth: "350px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Crear Nuevo Insumo</h2>
              <form onSubmit={handleAddNewIngredient} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 2, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre / Materia Prima</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Lechuga Romana"
                    value={newIngName}
                    onChange={e => setNewIngName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Unidad</label>
                  <select className="input-field" value={newIngUnit} onChange={e => setNewIngUnit(e.target.value as any)}>
                    <option value="u">u (Unds)</option>
                    <option value="g">g (Gramos)</option>
                    <option value="ml">ml (Líquido)</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Costo Base (L)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newIngCost || ""} 
                    onChange={e => setNewIngCost(Number(e.target.value))}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Grupo / Categoría de Insumo</label>
                  <select className="input-field" value={newIngGroup} onChange={e => setNewIngGroup(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {state.ingredientGroups?.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "0.75rem", width: "100%", backgroundColor: "var(--success)" }}>
                  Guardar en Catálogo
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTARIO ACTUAL (Tabla) */}
        {activeTab === "stock" && (
          <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden", animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Stock Actual de Insumos</h2>
              <span style={{ color: "var(--accent-color)", fontWeight: 700 }}>Total Invertido: L {state.ingredients.reduce((acc, ing) => acc + (ing.stock * ing.cost_per_unit), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Insumo</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Grupo</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Costo Unitario</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Stock Actual</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Métrica (Unidad)</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Costo Total Inventariado</th>
                  <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.ingredients.map((ing, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>
                      {editingId === ing.id ? (
                        <input 
                          type="text" className="input-field" 
                          value={editName} onChange={e => setEditName(e.target.value)}
                          style={{ padding: "0.25rem", width: "100%", minWidth: "120px" }}
                          autoFocus
                        />
                      ) : ing.name}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      {editingId === ing.id ? (
                        <select className="input-field" value={editGroup} onChange={e => setEditGroup(e.target.value)} style={{ padding: "0.25rem" }}>
                          <option value="">Sin Grupo</option>
                          {state.ingredientGroups?.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ 
                          padding: "0.2rem 0.5rem", 
                          backgroundColor: "var(--bg-tertiary)", 
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--accent-color)"
                        }}>
                          {ing.group || "Sin Grupo"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-muted)" }}>
                      {editingId === ing.id ? (
                        <input 
                          type="number" className="input-field" 
                          value={editCost} onChange={e => setEditCost(Number(e.target.value))}
                          style={{ padding: "0.25rem", width: "80px" }}
                          step="0.01" min="0"
                        />
                      ) : (
                         <span>L {ing.cost_per_unit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {ing.unit}</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: ing.stock < 1000 && ing.unit === "g" ? "var(--warning)" : "var(--text-primary)" }}>
                      {editingId === ing.id ? (
                        <input 
                          type="number" className="input-field" 
                          value={editStock} onChange={e => setEditStock(Number(e.target.value))}
                          style={{ padding: "0.25rem", width: "80px" }}
                          min="0" step="0.01"
                        />
                      ) : ing.stock.toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-muted)" }}>
                      {editingId === ing.id ? (
                        <select 
                          className="input-field" 
                          value={editUnit} 
                          onChange={e => setEditUnit(e.target.value as any)}
                          style={{ padding: "0.25rem" }}
                        >
                          <option value="u">u</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                        </select>
                      ) : ing.unit}
                    </td>
                    <td style={{ padding: "1rem", color: "var(--accent-color)", fontWeight: 700 }}>
                      L {(ing.stock * ing.cost_per_unit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                    {editingId === ing.id ? (
                       <button className="btn-primary" style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)" }} onClick={() => handleSaveEdit(ing.id)}>Guardar</button>
                    ) : (
                       <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                         <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }} onClick={() => { 
                           setEditingId(ing.id); 
                           setEditCost(ing.cost_per_unit); 
                           setEditName(ing.name);
                           setEditStock(ing.stock);
                           setEditUnit(ing.unit as any);
                           setEditGroup(ing.group || "");
                         }}>Editar</button>
                         <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", backgroundColor: "var(--warning)" }} onClick={() => handleDeleteIngredient(ing.id, ing.name)}>
                           🗑️
                         </button>
                       </div>
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {/* TAB 4: KARDEX (HISTORIAL DE LOGS) */}
        {activeTab === "kardex" && (
          <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden", animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Auditoría de Invenario (Kardex)</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Registro inmutable de entradas y salidas de materia prima.</p>
              </div>
            </div>
            
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha y Hora</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Usuario / Responsable</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Movimiento</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Insumo</th>
                  <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Cantidad</th>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Motivo / Ticket</th>
                </tr>
              </thead>
              <tbody>
                {/* Mostramos los logs ordenados por el más reciente */}
                {state.inventoryLogs && state.inventoryLogs.length > 0 ? (
                  [...state.inventoryLogs].reverse().map((log) => {
                    const ing = state.ingredients.find(i => i.id === log.ingredient_id);
                    const isOut = log.type === "out";
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {new Date(log.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>
                          {log.user}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ 
                            padding: "0.25rem 0.5rem", 
                            borderRadius: "100px", 
                            fontSize: "0.75rem", 
                            fontWeight: 700,
                            backgroundColor: isOut ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                            color: isOut ? "var(--warning)" : "var(--success)" 
                          }}>
                            {isOut ? "SALIDA" : "ENTRADA"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>
                          {log.ingredient_name || (ing ? ing.name : "Insumo Desconocido")}
                        </td>
                        <td style={{ padding: "1rem", fontWeight: 700, textAlign: "right" }}>
                          {isOut ? "-" : "+"}{log.quantity.toLocaleString()} {ing?.unit || ""}
                        </td>
                        <td style={{ padding: "1rem", color: "var(--text-muted)" }}>
                          {log.reason}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No hay registros de movimientos en el Kardex.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: GESTION DE GRUPOS DE INSUMOS */}
        {activeTab === "groups" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              
              {/* Formulario Nuevo Grupo */}
              <div className="glass-panel" style={{ flex: 1, minWidth: "300px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Añadir Nuevo Grupo</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Carnes" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      if (!newGroupName) return;
                      addIngredientGroup(newGroupName);
                      setNewGroupName("");
                    }}
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* Lista de Grupos */}
              <div className="glass-panel" style={{ flex: 2, minWidth: "400px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Grupos Maestros (Materia Prima)</h2>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      <th style={{ padding: "1rem", fontWeight: 600 }}>Nombre</th>
                      <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ingredientGroups?.map((group, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem" }}>
                          {editingGroup?.old === group ? (
                            <input 
                              className="input-field" 
                              value={editingGroup.new} 
                              onChange={(e) => setEditingGroup({ ...editingGroup, new: e.target.value })}
                              style={{ width: "200px" }}
                              autoFocus
                            />
                          ) : (
                            <span style={{ fontWeight: 600 }}>{group}</span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          {editingGroup?.old === group ? (
                            <button 
                              className="btn-primary" 
                              style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)" }}
                              onClick={() => {
                                if (editingGroup.new && editingGroup.new !== editingGroup.old) {
                                  updateIngredientGroup(editingGroup.old, editingGroup.new);
                                }
                                setEditingGroup(null);
                              }}
                            >
                              Guardar
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                onClick={() => setEditingGroup({ old: group, new: group })}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn-primary" 
                                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", backgroundColor: "var(--warning)" }}
                                onClick={() => {
                                  if (window.confirm(`¿Seguro que deseas eliminar el grupo "${group}"?`)) {
                                    removeIngredientGroup(group);
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
