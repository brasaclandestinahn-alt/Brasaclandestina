"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { formatCurrency } from "@/lib/utils";
import Sidebar from "@/components/Admin/Sidebar";

export default function InventoryDashboard() {
  const { state, hydrated, updateIngredientStock, editProduct, addIngredient, editIngredient, removeIngredient, addCategory, removeCategory, updateCategory, addIngredientGroup, removeIngredientGroup, updateIngredientGroup, signOut } = useAppState();
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

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

  const filteredIngredients = state.ingredients
    .filter(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(ing => selectedGroup === "all" || ing.group === selectedGroup)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>Inventario y Recetas (BOM)</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Control de materia prima. Estos componentes definen la disponibilidad real de los platillos del Menú.</p>
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
          }} className="scrollable-x">
            {[
              { id: "stock", label: "Inventario Actual" },
              { id: "management", label: "Gestión y Entradas" },
              { id: "kardex", label: "Kardex (Historial)" },
              { id: "groups", label: "Grupos de Insumos" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ 
                  padding: "0.6rem 1.25rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.8rem", transition: "var(--transition-fast)",
                  backgroundColor: activeTab === tab.id ? "var(--accent-color)" : "transparent",
                  color: activeTab === tab.id ? "white" : "var(--text-muted)",
                  border: "none", cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        {/* TAB 1: GESTION DE ENTRADAS (Forms) */}
        {activeTab === "management" && (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "3rem", animation: "fadeIn 0.3s ease-in-out" }}>
            {/* Formulario Ingreso de Stock */}
            <div className="glass-panel" style={{ padding: "2rem", flex: 1, minWidth: "300px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Añadir Cantidad a Existente</h2>
              <form onSubmit={handleAddStock} style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Insumo</label>
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
                    <option value="">-- Seleccionar --</option>
                    {state.ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Costo Actual (L)</label>
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
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Cantidad (+)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={addedQty || ""} 
                      onChange={e => setAddedQty(Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "1rem", width: "100%", marginTop: "0.5rem" }}>
                  Registrar Entrada
                </button>
              </form>
            </div>

            {/* Formulario Nuevo Insumo */}
            <div className="glass-panel" style={{ padding: "2rem", flex: 1, minWidth: "300px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Crear Nuevo Insumo</h2>
              <form onSubmit={handleAddNewIngredient} style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Nombre / Materia Prima</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Lechuga Romana"
                    value={newIngName}
                    onChange={e => setNewIngName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Unidad</label>
                    <select className="input-field" value={newIngUnit} onChange={e => setNewIngUnit(e.target.value as any)}>
                      <option value="u">u (Unds)</option>
                      <option value="g">g (Gramos)</option>
                      <option value="ml">ml (Líquido)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Costo Base (L)</label>
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
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Grupo / Categoría</label>
                  <select className="input-field" value={newIngGroup} onChange={e => setNewIngGroup(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {state.ingredientGroups?.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "1rem", width: "100%", backgroundColor: "var(--success)", marginTop: "0.5rem" }}>
                  Guardar en Catálogo
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTARIO ACTUAL */}
        {activeTab === "stock" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            {/* Header and Filters */}
            <div className="glass-panel inventory-filters" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", flex: 1 }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="🔍 Buscar por nombre..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ maxWidth: "300px", flex: 1 }}
                />
                <select 
                  className="input-field" 
                  value={selectedGroup} 
                  onChange={e => setSelectedGroup(e.target.value)}
                  style={{ maxWidth: "200px", flex: 1 }}
                >
                  <option value="all">Todos los Grupos</option>
                  {state.ingredientGroups?.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--accent-color)", fontWeight: 800, fontSize: "1.1rem" }}>Total Invertido: {formatCurrency(state.ingredients.reduce((acc, ing) => acc + (ing.stock * ing.cost_per_unit), 0))}</span>
              </div>
            </div>

            {/* Desktop/Tablet Table View */}
            <div className="inventory-table-container glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflowX: "auto" }}>
              <table className="inventory-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", position: "sticky", top: 0, zIndex: 10 }}>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Insumo</th>
                    <th className="hide-tablet" style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Grupo</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Costo Unit.</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textAlign: "center" }}>Stock</th>
                    <th className="hide-tablet" style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textAlign: "center" }}>Unidad</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map((ing) => (
                    <tr key={ing.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
                      <td style={{ padding: "1rem", fontWeight: 600 }}>
                        {editingId === ing.id ? (
                          <input 
                            type="text" className="input-field" 
                            value={editName} onChange={e => setEditName(e.target.value)}
                            style={{ padding: "0.25rem", width: "100%" }}
                            autoFocus
                          />
                        ) : (
                          <div>
                            {ing.name}
                            <div className="show-tablet" style={{ fontSize: "0.7rem", color: "var(--accent-color)", fontWeight: 700, display: "none" }}>{ing.group || "Varios"}</div>
                          </div>
                        )}
                      </td>
                      <td className="hide-tablet" style={{ padding: "1rem" }}>
                        {editingId === ing.id ? (
                          <select className="input-field" value={editGroup} onChange={e => setEditGroup(e.target.value)} style={{ padding: "0.25rem" }}>
                            <option value="">Sin Grupo</option>
                            {state.ingredientGroups?.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="badge-group">{ing.group || "Varios"}</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>
                        {editingId === ing.id ? (
                          <input 
                            type="number" className="input-field" 
                            value={editCost} onChange={e => setEditCost(Number(e.target.value))}
                            style={{ padding: "0.25rem", width: "80px", textAlign: "right" }}
                            step="0.01" min="0"
                          />
                        ) : formatCurrency(ing.cost_per_unit)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 800, color: ing.stock < 5 ? "var(--danger)" : "var(--text-primary)" }}>
                        {editingId === ing.id ? (
                          <input 
                            type="number" className="input-field" 
                            value={editStock} onChange={e => setEditStock(Number(e.target.value))}
                            style={{ padding: "0.25rem", width: "80px", textAlign: "center" }}
                            min="0" step="0.01"
                          />
                        ) : ing.stock.toLocaleString()}
                      </td>
                      <td className="hide-tablet" style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                        {editingId === ing.id ? (
                          <select className="input-field" value={editUnit} onChange={e => setEditUnit(e.target.value as any)} style={{ padding: "0.25rem" }}>
                            <option value="u">u</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                          </select>
                        ) : ing.unit}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "var(--accent-color)", fontWeight: 800 }}>
                        {formatCurrency(ing.stock * ing.cost_per_unit)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        {editingId === ing.id ? (
                          <button className="btn-icon btn-save" onClick={() => handleSaveEdit(ing.id)}>💾</button>
                        ) : (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn-icon btn-edit" onClick={() => { 
                              setEditingId(ing.id); 
                              setEditCost(ing.cost_per_unit); 
                              setEditName(ing.name);
                              setEditStock(ing.stock);
                              setEditUnit(ing.unit as any);
                              setEditGroup(ing.group || "");
                            }}>✏️</button>
                            <button className="btn-icon btn-delete" onClick={() => handleDeleteIngredient(ing.id, ing.name)}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="inventory-cards-container">
              {filteredIngredients.map((ing) => (
                <div key={ing.id} className="inventory-card glass-panel">
                  <div className="inventory-card__header">
                    <h3 className="inventory-card__title">{ing.name}</h3>
                    <span className={`inventory-card__badge ${ing.stock < 5 ? 'inventory-card__badge--low' : ''}`}>
                      {ing.stock} {ing.unit}
                    </span>
                  </div>
                  <div className="inventory-card__body">
                    <div className="inventory-card__info">
                      <span className="inventory-card__label">Costo Unit:</span>
                      <span className="inventory-card__value">{formatCurrency(ing.cost_per_unit)}</span>
                    </div>
                    <div className="inventory-card__info">
                      <span className="inventory-card__label">Total Invertido:</span>
                      <span className="inventory-card__value inventory-card__value--total">{formatCurrency(ing.stock * ing.cost_per_unit)}</span>
                    </div>
                    <div className="inventory-card__info">
                      <span className="inventory-card__label">Grupo:</span>
                      <span className="inventory-card__value">{ing.group || "Varios"}</span>
                    </div>
                  </div>
                  <div className="inventory-card__actions">
                    <button className="inventory-card__btn inventory-card__btn--edit" onClick={() => {
                        setEditingId(ing.id); 
                        setEditCost(ing.cost_per_unit); 
                        setEditName(ing.name);
                        setEditStock(ing.stock);
                        setEditUnit(ing.unit as any);
                        setEditGroup(ing.group || "");
                        setActiveTab("stock"); // Ensure it stays on tab
                    }}>EDITAR</button>
                    <button className="inventory-card__btn inventory-card__btn--delete" onClick={() => handleDeleteIngredient(ing.id, ing.name)}>ELIMINAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KARDEX */}
        {activeTab === "kardex" && (
          <div className="glass-panel" style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", overflow: "hidden", animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Auditoría de Invenario (Kardex)</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Registro inmutable de entradas y salidas de materia prima.</p>
              </div>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Responsable</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Tipo</th>
                    <th style={{ padding: "1rem", fontWeight: 600 }}>Insumo</th>
                    <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Cantidad</th>
                    <th className="hide-tablet" style={{ padding: "1rem", fontWeight: 600 }}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {state.inventoryLogs && state.inventoryLogs.length > 0 ? (
                    [...state.inventoryLogs].reverse().map((log) => {
                      const ing = state.ingredients.find(i => i.id === log.ingredient_id);
                      const isOut = log.type === "out";
                      return (
                        <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                            {new Date(log.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td style={{ padding: "1rem", fontWeight: 600 }}>{log.user}</td>
                          <td style={{ padding: "1rem" }}>
                            <span style={{ 
                              padding: "0.25rem 0.5rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                              backgroundColor: isOut ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                              color: isOut ? "var(--warning)" : "var(--success)" 
                            }}>
                              {isOut ? "SALIDA" : "ENTRADA"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", fontWeight: 600 }}>{log.ingredient_name || (ing ? ing.name : "Insumo")}</td>
                          <td style={{ padding: "1rem", fontWeight: 700, textAlign: "right" }}>{isOut ? "-" : "+"}{log.quantity.toLocaleString()}</td>
                          <td className="hide-tablet" style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{log.reason}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Sin registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: GRUPOS */}
        {activeTab === "groups" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <div className="glass-panel" style={{ flex: 1, minWidth: "300px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Añadir Nuevo Grupo</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <input className="input-field" placeholder="Ej. Carnes" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <button className="btn-primary" onClick={() => { if (!newGroupName) return; addIngredientGroup(newGroupName); setNewGroupName(""); }}>Añadir</button>
                </div>
              </div>

              <div className="glass-panel" style={{ flex: 2, minWidth: "300px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Grupos Maestros</h2>
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
                            <input className="input-field" value={editingGroup.new} onChange={(e) => setEditingGroup({ ...editingGroup, new: e.target.value })} style={{ width: "200px" }} autoFocus />
                          ) : (
                            <span style={{ fontWeight: 600 }}>{group}</span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          {editingGroup?.old === group ? (
                            <button className="btn-primary" style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)" }} onClick={() => { if (editingGroup.new && editingGroup.new !== editingGroup.old) updateIngredientGroup(editingGroup.old, editingGroup.new); setEditingGroup(null); }}>Guardar</button>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button className="btn-icon" onClick={() => setEditingGroup({ old: group, new: group })}>✏️</button>
                              <button className="btn-icon" style={{ color: "var(--warning)" }} onClick={() => { if (window.confirm(`¿Seguro que deseas eliminar el grupo "${group}"?`)) removeIngredientGroup(group); }}>🗑️</button>
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

      <style jsx>{`
        .inventory-filters {
          flex-direction: row;
        }

        .inventory-cards-container {
          display: none;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .badge-group {
          padding: 0.2rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-color);
          text-transform: uppercase;
        }

        .btn-icon {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: var(--bg-primary);
          transform: translateY(-2px);
        }

        .btn-save { color: var(--success); }
        .btn-edit { color: var(--accent-color); }
        .btn-delete { color: var(--danger); }

        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        /* Mobile Card Styling */
        .inventory-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-left: 4px solid var(--accent-color);
        }

        .inventory-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .inventory-card__title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .inventory-card__badge {
          background: var(--bg-tertiary);
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--accent-color);
        }

        .inventory-card__badge--low {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .inventory-card__info {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .inventory-card__label {
          color: var(--text-muted);
        }

        .inventory-card__value {
          font-weight: 600;
        }

        .inventory-card__value--total {
          color: var(--accent-color);
          font-weight: 800;
        }

        .inventory-card__actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .inventory-card__btn {
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .inventory-card__btn--edit {
          background: var(--accent-color);
          color: white;
        }

        .inventory-card__btn--delete {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        @media (max-width: 900px) {
          .hide-tablet {
            display: none !important;
          }
          .show-tablet {
            display: block !important;
          }
        }

        @media (max-width: 600px) {
          .inventory-table-container {
            display: none;
          }
          .inventory-cards-container {
            display: grid;
          }
          .inventory-filters {
            flex-direction: column;
            align-items: stretch;
          }
          .inventory-filters input, .inventory-filters select {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
    </AuthGuard>
  );
}
