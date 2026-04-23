"use client";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { formatCurrency } from "@/lib/utils";
import Sidebar from "@/components/Admin/Sidebar";

export default function InventoryDashboard() {
  const { 
    state, 
    hydrated, 
    updateIngredientStock, 
    addIngredient, 
    editIngredient, 
    removeIngredient, 
    addIngredientGroup, 
    removeIngredientGroup, 
    updateIngredientGroup 
  } = useAppState();
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

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

  // Ingredient Group Manager State
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<{old: string, new: string} | null>(null);

  if (!hydrated) return null;

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || addedQty <= 0) return;

    const ing = state.ingredients.find(i => i.id === selectedIngredient);
    if (!ing) return;

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
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar ${name}?`)) {
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
          <div className="admin-container">
            <header style={{ marginBottom: "2rem" }}>
              <h1 className="section-title-fluid">Inventario y Materia Prima</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Control centralizado de insumos, costos y existencias.</p>
            </header>

            {/* Navegación de Tabs Responsiva */}
            <nav className="admin-tabs-container">
              {[
                { id: "stock", label: "Inventario Actual" },
                { id: "management", label: "Gestión y Entradas" },
                { id: "kardex", label: "Kardex (Historial)" },
                { id: "groups", label: "Grupos de Insumos" }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* --- TAB 1: INVENTARIO ACTUAL --- */}
            {activeTab === "stock" && (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
                  <div className="admin-form-row">
                    <input 
                      type="text" 
                      className="input-field-admin" 
                      placeholder="🔍 Buscar por nombre..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="input-field-admin" 
                      value={selectedGroup} 
                      onChange={e => setSelectedGroup(e.target.value)}
                    >
                      <option value="all">Todos los Grupos</option>
                      {state.ingredientGroups?.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <div style={{ flexBasis: "100%", textAlign: "right", marginTop: "1rem" }}>
                      <span style={{ color: "var(--accent-red)", fontWeight: 800, fontSize: "1.1rem" }}>
                        Inversión Total: {formatCurrency(state.ingredients.reduce((acc, ing) => acc + (ing.stock * ing.cost_per_unit), 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="table-wrapper admin-card" style={{ padding: 0 }}>
                  <table className="admin-table responsive-stack">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Costo Unit.</th>
                        <th>Stock</th>
                        <th>Total</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ing) => (
                        <tr key={ing.id}>
                          <td data-label="Insumo">
                            {editingId === ing.id ? (
                              <input 
                                type="text" className="input-field-admin" 
                                value={editName} onChange={e => setEditName(e.target.value)}
                                style={{ padding: "4px" }}
                              />
                            ) : (
                              <div>
                                <span style={{ fontWeight: 700 }}>{ing.name}</span>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{ing.group}</div>
                              </div>
                            )}
                          </td>
                          <td data-label="Costo Unit.">
                            {editingId === ing.id ? (
                              <input 
                                type="number" className="input-field-admin" 
                                value={editCost} onChange={e => setEditCost(Number(e.target.value))}
                                style={{ padding: "4px", width: "80px" }}
                              />
                            ) : formatCurrency(ing.cost_per_unit)}
                          </td>
                          <td data-label="Stock">
                            <span style={{ color: ing.stock < 5 ? "var(--accent-red)" : "inherit", fontWeight: 700 }}>
                              {ing.stock} {ing.unit}
                            </span>
                          </td>
                          <td data-label="Total">{formatCurrency(ing.stock * ing.cost_per_unit)}</td>
                          <td style={{ textAlign: "right" }}>
                            {editingId === ing.id ? (
                              <button className="action-btn-admin" onClick={() => handleSaveEdit(ing.id)}>💾</button>
                            ) : (
                              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                <button className="action-btn-admin" onClick={() => { 
                                  setEditingId(ing.id); setEditCost(ing.cost_per_unit); setEditName(ing.name);
                                  setEditStock(ing.stock); setEditUnit(ing.unit as any); setEditGroup(ing.group || "");
                                }}>✏️</button>
                                <button className="action-btn-admin" onClick={() => handleDeleteIngredient(ing.id, ing.name)}>🗑️</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB 2: GESTIÓN Y ENTRADAS --- */}
            {activeTab === "management" && (
              <div className="admin-section-grid" style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Registrar Entrada Logística</h2>
                  <form onSubmit={handleAddStock} className="admin-form-row" style={{ flexDirection: "column" }}>
                    <div style={{ width: "100%" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>SELECCIONAR INSUMO</label>
                      <select 
                        className="input-field-admin" style={{ width: "100%" }}
                        value={selectedIngredient} 
                        onChange={e => {
                          const id = e.target.value;
                          setSelectedIngredient(id);
                          if (id) {
                             const ing = state.ingredients.find(i => i.id === id);
                             if (ing) setAddedCost(ing.cost_per_unit);
                          }
                        }}
                        required
                      >
                        <option value="">-- Buscar Insumo --</option>
                        {state.ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-row" style={{ width: "100%" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>NUEVO COSTO (L)</label>
                        <input type="number" className="input-field-admin" style={{ width: "100%" }} value={addedCost} onChange={e => setAddedCost(Number(e.target.value))} step="0.01" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>CANTIDAD (+)</label>
                        <input type="number" className="input-field-admin" style={{ width: "100%" }} value={addedQty || ""} onChange={e => setAddedQty(Number(e.target.value))} required min="1" />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}>REGISTRAR INGRESO</button>
                  </form>
                </div>

                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Crear Insumo en Maestro</h2>
                  <form onSubmit={handleAddNewIngredient} className="admin-form-row" style={{ flexDirection: "column" }}>
                    <div style={{ width: "100%" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>NOMBRE DEL INSUMO</label>
                      <input type="text" className="input-field-admin" style={{ width: "100%" }} value={newIngName} onChange={e => setNewIngName(e.target.value)} required placeholder="Ej: Tomate Pera" />
                    </div>
                    <div className="admin-form-row" style={{ width: "100%" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>UNIDAD</label>
                        <select className="input-field-admin" style={{ width: "100%" }} value={newIngUnit} onChange={e => setNewIngUnit(e.target.value as any)}>
                          <option value="u">Unidades (u)</option>
                          <option value="g">Gramos (g)</option>
                          <option value="ml">Mililitros (ml)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>COSTO BASE (L)</label>
                        <input type="number" className="input-field-admin" style={{ width: "100%" }} value={newIngCost || ""} onChange={e => setNewIngCost(Number(e.target.value))} required step="0.01" />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1rem", marginTop: "1rem", backgroundColor: "var(--success)" }}>GUARDAR EN CATÁLOGO</button>
                  </form>
                </div>
              </div>
            )}

            {/* --- TAB 3: KARDEX --- */}
            {activeTab === "kardex" && (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card" style={{ padding: 0 }}>
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th className="sticky-col">Insumo</th>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Cant.</th>
                          <th>Responsable</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.inventoryLogs && [...state.inventoryLogs].reverse().map((log) => {
                          const isOut = log.type === "out";
                          return (
                            <tr key={log.id}>
                              <td className="sticky-col" style={{ fontWeight: 700 }}>{log.ingredient_name}</td>
                              <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(log.date).toLocaleString()}</td>
                              <td>
                                <span style={{ color: isOut ? 'var(--accent-red)' : 'var(--success)', fontWeight: 800, fontSize: "10px" }}>
                                  {isOut ? '⬇ SALIDA' : '⬆ ENTRADA'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>{isOut ? "-" : "+"}{log.quantity}</td>
                              <td style={{ fontSize: "13px" }}>{log.user}</td>
                              <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{log.reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 4: GRUPOS DE INSUMOS --- */}
            {activeTab === "groups" && (
              <div className="admin-section-grid" style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Añadir Nuevo Grupo</h2>
                  <div className="admin-form-row">
                    <input className="input-field-admin" placeholder="Ej: Vegetales" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                    <button className="btn-primary" style={{ padding: "0 2rem" }} onClick={() => { if (!newGroupName) return; addIngredientGroup(newGroupName); setNewGroupName(""); }}>AÑADIR</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Grupos Maestros</h2>
                  <div className="table-wrapper">
                    <table className="admin-table responsive-stack">
                      <thead>
                        <tr>
                          <th>Nombre del Grupo</th>
                          <th style={{ textAlign: "right" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.ingredientGroups?.map((group, idx) => (
                          <tr key={idx}>
                            <td data-label="Nombre del Grupo">
                              {editingGroup?.old === group ? (
                                <input className="input-field-admin" value={editingGroup.new} onChange={(e) => setEditingGroup({ ...editingGroup, new: e.target.value })} autoFocus />
                              ) : (
                                <span style={{ fontWeight: 700 }}>{group}</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {editingGroup?.old === group ? (
                                <button className="action-btn-admin" style={{ backgroundColor: "var(--success)" }} onClick={() => { if (editingGroup.new && editingGroup.new !== editingGroup.old) updateIngredientGroup(editingGroup.old, editingGroup.new); setEditingGroup(null); }}>💾</button>
                              ) : (
                                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                  <button className="action-btn-admin" onClick={() => setEditingGroup({ old: group, new: group })}>✏️</button>
                                  <button className="action-btn-admin" onClick={() => { if (window.confirm(`¿Eliminar "${group}"?`)) removeIngredientGroup(group); }}>🗑️</button>
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
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
