"use client";
import React from "react";
import { useState } from "react";
import { useAppState } from "@/lib/useStore";
import { Ingredient, BASE_UNITS } from "@/lib/mockDB";
import AuthGuard from "@/components/Auth/AuthGuard";
import { formatCurrency } from "@/lib/utils";
import Sidebar from "@/components/Admin/Sidebar";
import KardexTab from "@/components/Admin/KardexTab";

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
    updateIngredientGroup,
    addInventoryLog,
    addCustomUnit,
    removeCustomUnit
  } = useAppState();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [addedQty, setAddedQty] = useState<number>(0);
  const [addedCost, setAddedCost] = useState<number | "">("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState<string>("u");
  const [newIngCost, setNewIngCost] = useState<number>(0);
  const [showCalc, setShowCalc] = useState(false);
  const [calcPrecioTotal, setCalcPrecioTotal] = useState<string>("");
  const [calcUnidades, setCalcUnidades] = useState<string>("");
  const calcPrecioUnitario = (() => {
    const total = parseFloat(calcPrecioTotal);
    const units = parseFloat(calcUnidades);
    if (isNaN(total) || isNaN(units) || units <= 0) return null;
    return total / units;
  })();
  const [newIngGroup, setNewIngGroup] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editStock, setEditStock] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<string>("u");
  const [editGroup, setEditGroup] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"stock" | "management" | "kardex" | "groups">("stock");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<{old: string, new: string} | null>(null);

  const allUnits = [
    ...BASE_UNITS,
    ...(state.config?.custom_units || []).map((u: string) => ({
      value: u,
      label: `${u} (personalizada)`,
      category: "Personalizada"
    }))
  ];

  const unitsByCategory = allUnits.reduce((acc: Record<string, typeof allUnits>, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {});

  const UnitSelect = ({ value, onChange, style }: { 
    value: string; 
    onChange: (val: string) => void;
    style?: React.CSSProperties;
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value === "__nueva__") {
        const nueva = window.prompt("Escribe el nombre de la nueva unidad (ej: pza, ración, bolsa):");
        if (nueva && nueva.trim()) {
          addCustomUnit(nueva.trim());
          onChange(nueva.trim());
        }
      } else {
        onChange(e.target.value);
      }
    };
    
    return (
      <select 
        className="input-field-admin" 
        value={value} 
        onChange={handleChange}
        style={{ width: "100%", ...style }}
      >
        <option value="">Seleccionar unidad...</option>
        {Object.entries(unitsByCategory).map(([category, units]) => (
          <optgroup key={category} label={category}>
            {units.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </optgroup>
        ))}
        <option value="__nueva__">➕ Crear nueva unidad...</option>
      </select>
    );
  };

  if (!hydrated) return null;

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || addedQty <= 0) return;
    const ing = state.ingredients.find((i: Ingredient) => i.id === selectedIngredient);
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
    const original = state.ingredients.find((i: Ingredient) => i.id === id);
    if (!original) return;
    
    const stockChanged = original.stock !== editStock;
    const stockDiff = editStock - original.stock;
    
    // Si cambió el stock, pedir motivo del ajuste
    let reason = "Ajuste manual";
    if (stockChanged) {
      const promptedReason = window.prompt(
        `Stock actual: ${original.stock} ${original.unit}\n` +
        `Stock nuevo: ${editStock} ${original.unit}\n` +
        `Diferencia: ${stockDiff > 0 ? "+" : ""}${stockDiff} ${original.unit}\n\n` +
        `Indica el motivo del ajuste:\n` +
        `Ejemplos: "Corrección de error de captura", "Merma", "Desperdicio", "Recuento físico"`,
        "Corrección de error de captura"
      );
      
      if (promptedReason === null) {
        // Usuario canceló
        return;
      }
      reason = promptedReason.trim() || "Ajuste manual";
    }
    
    // Aplicar la edición
    editIngredient(id, { 
      name: editName, 
      cost_per_unit: editCost, 
      stock: editStock, 
      unit: editUnit, 
      group: editGroup 
    });
    
    // Registrar log en Kardex si cambió el stock
    if (stockChanged && stockDiff !== 0) {
      addInventoryLog({
        id: `log_ajuste_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        ingredient_id: id,
        ingredient_name: original.name,
        type: stockDiff > 0 ? "in" : "out",
        quantity: Math.abs(stockDiff),
        reason: `Ajuste manual: ${reason}`,
        user: "Admin",
        date: new Date().toISOString()
      });
    }
    
    setEditingId(null);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar ${name}?`)) removeIngredient(id);
  };

  const filteredIngredients = state.ingredients
    .filter((ing: Ingredient) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((ing: Ingredient) => selectedGroup === "all" || ing.group === selectedGroup)
    .sort((a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name));

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />
        <main className="main-content-responsive">
          <div className="admin-container">
            <header style={{ marginBottom: "2rem" }}>
              <h1 className="section-title-fluid">Inventario y Materia Prima</h1>
              <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                Control centralizado de insumos, costos y existencias.
              </p>
            </header>

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

            {activeTab === "stock" && (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
                  <div className="admin-form-row">
                    <input 
                      type="text" 
                      className="input-field-admin" 
                      placeholder="🔍 Buscar por nombre..." 
                      value={searchTerm} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="input-field-admin" 
                      value={selectedGroup} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGroup(e.target.value)}
                    >
                      <option value="all">Todos los Grupos</option>
                      {state.ingredientGroups?.map((g: string) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <div style={{ flexBasis: "100%", textAlign: "right", marginTop: "1rem" }}>
                      <span style={{ color: "var(--color-accent-brasa)", fontWeight: 800, fontSize: "1.1rem" }}>
                        Inversión Total: {formatCurrency(state.ingredients.reduce((acc: number, ing: Ingredient) => acc + (ing.stock * ing.cost_per_unit), 0))}
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
                      {filteredIngredients.map((ing: Ingredient) => (
                        <tr key={ing.id}>
                          <td data-label="Insumo">
                            {editingId === ing.id ? (
                              <input 
                                type="text" className="input-field-admin" 
                                value={editName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                style={{ padding: "4px" }}
                              />
                            ) : (
                              <div>
                                <span style={{ fontWeight: 700, color: "var(--color-text-brand)" }}>{ing.name}</span>
                                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>{ing.group}</div>
                              </div>
                            )}
                          </td>
                          <td data-label="Costo Unit.">
                            {editingId === ing.id ? (
                              <input 
                                type="number" className="input-field-admin" 
                                value={editCost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCost(Number(e.target.value))}
                                style={{ padding: "4px", width: "80px" }}
                              />
                            ) : (
                              <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{formatCurrency(ing.cost_per_unit)}</span>
                            )}
                          </td>
                          <td data-label="Stock">
                            {editingId === ing.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <input 
                                    type="number"
                                    step="any"
                                    className="input-field-admin"
                                    value={editStock}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditStock(Number(e.target.value))}
                                    style={{ padding: "4px", width: "80px", textAlign: "right" }}
                                  />
                                  <UnitSelect 
                                    value={editUnit} 
                                    onChange={val => setEditUnit(val)} 
                                    style={{ width: "100px", padding: "2px", fontSize: "11px" }}
                                  />
                                </div>
                                {editStock !== ing.stock && (
                                  <span style={{ 
                                    fontSize: "10px", 
                                    color: editStock > ing.stock ? "var(--success, #27500A)" : "var(--color-accent-brasa, #E8593C)",
                                    fontWeight: 700
                                  }}>
                                    {editStock > ing.stock ? "+" : ""}{(editStock - ing.stock).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ 
                                color: ing.stock < 5 ? "var(--color-accent-brasa)" : "var(--color-text-primary)", 
                                fontWeight: 700 
                              }}>
                                {ing.stock} {ing.unit}
                              </span>
                            )}
                          </td>
                          <td data-label="Total">
                            <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{formatCurrency(ing.stock * ing.cost_per_unit)}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {editingId === ing.id ? (
                              <button className="action-btn-admin" onClick={() => handleSaveEdit(ing.id)}>💾</button>
                            ) : (
                              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                <button className="action-btn-admin" onClick={() => { 
                                  setEditingId(ing.id); setEditCost(ing.cost_per_unit); setEditName(ing.name);
                                  setEditStock(ing.stock); setEditUnit(ing.unit); setEditGroup(ing.group || "");
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

            {activeTab === "management" && (
              <div className="admin-section-grid" style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--color-text-heading)" }}>Registrar Entrada Logística</h2>
                  <form onSubmit={handleAddStock} className="admin-form-row" style={{ flexDirection: "column" }}>
                    <div style={{ width: "100%" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>SELECCIONAR INSUMO</label>
                      <select 
                        className="input-field-admin" style={{ width: "100%" }}
                        value={selectedIngredient} 
                        onChange={e => {
                          const id = e.target.value;
                          setSelectedIngredient(id);
                          if (id) {
                             const ing = state.ingredients.find((i: Ingredient) => i.id === id);
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
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>NUEVO COSTO (L)</label>
                        <input type="number" className="input-field-admin" style={{ width: "100%" }} value={addedCost} onChange={e => setAddedCost(Number(e.target.value))} step="0.01" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>CANTIDAD (+)</label>
                        <input type="number" className="input-field-admin" style={{ width: "100%" }} value={addedQty || ""} onChange={e => setAddedQty(Number(e.target.value))} required min="1" />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}>REGISTRAR INGRESO</button>
                  </form>
                </div>

                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--color-text-heading)" }}>Crear Insumo en Maestro</h2>
                  <form onSubmit={handleAddNewIngredient} className="admin-form-row" style={{ flexDirection: "column" }}>
                    <div style={{ width: "100%" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>NOMBRE DEL INSUMO</label>
                      <input type="text" className="input-field-admin" style={{ width: "100%" }} value={newIngName} onChange={e => setNewIngName(e.target.value)} required placeholder="Ej: Tomate Pera" />
                    </div>
                    <div className="admin-form-row" style={{ width: "100%" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>UNIDAD</label>
                        <UnitSelect 
                          value={newIngUnit} 
                          onChange={val => setNewIngUnit(val)} 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 700 }}>COSTO BASE (L)</label>
                        <input
                          type="number"
                          className="input-field-admin"
                          style={{ width: "100%" }}
                          value={newIngCost || ""}
                          onChange={e => setNewIngCost(Number(e.target.value))}
                          required
                          step="0.01"
                        />
                        {/* Calculadora de costo por unidad */}
                        <div style={{ marginTop: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setShowCalc(!showCalc)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#E8603C", fontWeight: 700, padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            {showCalc ? "▲ Ocultar calculadora" : "🧮 Calcular desde precio de paquete"}
                          </button>
                          {showCalc && (
                            <div style={{ marginTop: "8px", padding: "12px", background: "var(--color-bg-secondary, #F5F1ED)", borderRadius: "8px", border: "1px solid var(--color-border, #EBEBEB)" }}>
                              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted, #5C5550)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                                Calculadora de costo unitario
                              </p>
                              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted, #5C5550)" }}>Precio del paquete (L)</label>
                                  <input
                                    type="number"
                                    placeholder="120.00"
                                    value={calcPrecioTotal}
                                    onChange={e => setCalcPrecioTotal(e.target.value)}
                                    style={{ width: "110px", padding: "6px 8px", border: "1px solid var(--color-border, #EBEBEB)", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600, background: "white" }}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <span style={{ fontSize: "1.2rem", color: "var(--color-text-muted, #5C5550)", paddingBottom: "6px" }}>÷</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted, #5C5550)" }}>Unidades por paquete</label>
                                  <input
                                    type="number"
                                    placeholder="100"
                                    value={calcUnidades}
                                    onChange={e => setCalcUnidades(e.target.value)}
                                    style={{ width: "110px", padding: "6px 8px", border: "1px solid var(--color-border, #EBEBEB)", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600, background: "white" }}
                                    min="1"
                                    step="1"
                                  />
                                </div>
                                {calcPrecioUnitario !== null && (
                                  <>
                                    <span style={{ fontSize: "1.2rem", color: "var(--color-text-muted, #5C5550)", paddingBottom: "6px" }}>=</span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                      <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted, #5C5550)" }}>Costo por unidad</label>
                                      <div style={{ padding: "6px 10px", background: "rgba(232,96,60,0.08)", border: "1px solid rgba(232,96,60,0.3)", borderRadius: "6px" }}>
                                        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#E8603C", whiteSpace: "nowrap" }}>
                                          L. {calcPrecioUnitario.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewIngCost(parseFloat(calcPrecioUnitario.toFixed(4)));
                                        setShowCalc(false);
                                        setCalcPrecioTotal("");
                                        setCalcUnidades("");
                                      }}
                                      style={{ padding: "7px 14px", background: "#E8603C", color: "white", border: "none", borderRadius: "100px", fontSize: "12px", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(232,96,60,0.25)", marginBottom: "0" }}
                                    >
                                      ✓ Usar L. {calcPrecioUnitario.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}
                                    </button>
                                  </>
                                )}
                              </div>
                              <p style={{ fontSize: "10px", color: "var(--color-text-muted, #5C5550)", marginTop: "8px", fontStyle: "italic" }}>
                                Ej: caja de 100 tenedores a L. 120 → L. 1.20 por unidad
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      style={{
                        width: "100%", padding: "1rem", marginTop: "1rem",
                        backgroundColor: "#E8603C", color: "white",
                        border: "none", borderRadius: "var(--radius-md, 8px)",
                        fontWeight: 800, fontSize: "0.9rem",
                        cursor: "pointer", letterSpacing: "0.03em",
                        transition: "background 150ms"
                      }}
                    >
                      GUARDAR EN CATÁLOGO
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "kardex" && (
              <KardexTab logs={state.inventoryLogs || []} ingredients={state.ingredients} />
            )}

            {activeTab === "groups" && (
              <div className="admin-section-grid" style={{ animation: "fadeIn 0.3s" }}>
                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--color-text-heading)" }}>Añadir Nuevo Grupo</h2>
                  <div className="admin-form-row">
                    <input className="input-field-admin" placeholder="Ej: Vegetales" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                    <button className="btn-primary" style={{ padding: "0 2rem" }} onClick={() => { if (!newGroupName) return; addIngredientGroup(newGroupName); setNewGroupName(""); }}>AÑADIR</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h2 className="serif" style={{ fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--color-text-heading)" }}>Grupos Maestros</h2>
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
                                <span style={{ fontWeight: 700, color: "var(--color-text-brand)" }}>{group}</span>
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
