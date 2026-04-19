"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

export default function InventoryDashboard() {
  const { state, hydrated, updateIngredientStock, addProductWithRecipe, editProduct, addIngredient, editIngredient, removeIngredient } = useAppState();
  
  // Stock Form State
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [addedQty, setAddedQty] = useState<number>(0);
  const [addedCost, setAddedCost] = useState<number | "">("");

  // New Ingredient Add Form State
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState<"g" | "ml" | "u">("u");
  const [newIngCost, setNewIngCost] = useState<number>(0);

  // Edit Ingredient State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editStock, setEditStock] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<"g" | "ml" | "u">("u");

  // Tab State
  const [activeTab, setActiveTab] = useState<"stock" | "management" | "builder" | "kardex">("stock");

  // Recipe Builder Form State
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [builderRecipe, setBuilderRecipe] = useState<{ingredient_id: string, quantity: number}[]>([]);
  const [currentBuilderIngredient, setCurrentBuilderIngredient] = useState<string>("");
  const [currentBuilderQty, setCurrentBuilderQty] = useState<number>(1);

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
      stock: 0
    });
    setNewIngName("");
    setNewIngCost(0);
    alert("¡Nuevo insumo agregado al catálogo maestros!");
  };

  const handleSaveEdit = (id: string) => {
    editIngredient(id, { 
      name: editName, 
      cost_per_unit: editCost, 
      stock: editStock, 
      unit: editUnit 
    });
    setEditingId(null);
    alert("¡Insumo actualizado en su totalidad!");
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro/a que deseas ELIMINAR permanentemente el insumo: ${name}?\n\nEsta acción podría impactar a los platillos que dependen de él.`)) {
      removeIngredient(id);
    }
  };

  const handleAddRecipeItem = () => {
    if (!currentBuilderIngredient || currentBuilderQty <= 0) return;
    setBuilderRecipe(prev => [...prev, { ingredient_id: currentBuilderIngredient, quantity: currentBuilderQty }]);
    setCurrentBuilderQty(1);
    setCurrentBuilderIngredient("");
  };

  const handleSaveProduct = () => {
    if (!productName || !productPrice || builderRecipe.length === 0) return alert("Faltan datos o ingredientes.");
    
    if (editingProductId) {
      editProduct(editingProductId, {
        name: productName,
        price: Number(productPrice),
        recipe: builderRecipe
      });
      alert("¡Platillo actualizado correctamente!");
    } else {
      addProductWithRecipe({
        id: "p_" + Math.random().toString(36).substr(2, 6),
        name: productName,
        description: "Agregado desde el panel de recetas.",
        category: "Personalizados",
        price: Number(productPrice),
        image_url: "/placeholder-burger.webp",
        is_active: true,
        recipe: builderRecipe
      });
      alert("¡Platillo registrado correctamente!");
    }
    
    setEditingProductId("");
    setProductName("");
    setProductPrice("");
    setBuilderRecipe([]);
  };

  const loadProductForEditing = (pid: string) => {
    setEditingProductId(pid);
    if (!pid) {
      setProductName("");
      setProductPrice("");
      setBuilderRecipe([]);
      return;
    }
    const target = state.products.find(p => p.id === pid);
    if (target) {
      setProductName(target.name);
      setProductPrice(target.price.toString());
      setBuilderRecipe(target.recipe || []);
    }
  };

  const handleRemoveRecipeItem = (index: number) => {
    setBuilderRecipe(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Historial de Pedidos</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Gestión de Costos/Precios</Link>
          <Link href="/admin/finances" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Configuración</Link>
          
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
            onClick={() => setActiveTab("builder")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "builder" ? "var(--accent-color)" : "transparent",
              color: activeTab === "builder" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            Constructor de Recetas
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
                    <td style={{ padding: "1rem", color: "var(--text-muted)" }}>
                      {editingId === ing.id ? (
                        <input 
                          type="number" className="input-field" 
                          value={editCost} onChange={e => setEditCost(Number(e.target.value))}
                          style={{ padding: "0.25rem", width: "80px" }}
                          step="0.01" min="0"
                        />
                      ) : (
                         <span>L {ing.cost_per_unit.toFixed(2)} / {ing.unit}</span>
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

        {/* TAB 3: CREADOR DE RECETAS (BOM) */}
        {activeTab === "builder" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            
            <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <label style={{ fontWeight: 600 }}>Seleccionar Acción:</label>
              <select className="input-field" style={{ maxWidth: "400px", padding: "0.5rem" }} value={editingProductId} onChange={e => loadProductForEditing(e.target.value)}>
                <option value="">✨ Crear Nuevo Platillo (BOM)</option>
                {state.products.map(p => (
                  <option key={p.id} value={p.id}>✏️ Editar: {p.name}</option>
                ))}
              </select>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", display: "flex", gap: "2rem", flexWrap: "wrap", borderLeft: "4px solid var(--accent-color)" }}>
              
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>{editingProductId ? "Editar Platillo" : "Nuevo Platillo (BOM)"}</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre del Producto Terminado</label>
                  <input type="text" className="input-field" placeholder="Ej. Tacos al Pastor" value={productName} onChange={e => setProductName(e.target.value)} />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Precio de Venta (L)</label>
                  <input type="number" className="input-field" placeholder="100.00" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                </div>

                <div style={{ padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Añadir Insumo a la Receta</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <select className="input-field" value={currentBuilderIngredient} onChange={e => setCurrentBuilderIngredient(e.target.value)} style={{ flex: 2 }}>
                      <option value="">Seleccionar Insumo...</option>
                      {state.ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                    <input type="number" className="input-field" value={currentBuilderQty} onChange={e => setCurrentBuilderQty(Number(e.target.value))} style={{ flex: 1 }} min="1" />
                    <button className="btn-primary" onClick={handleAddRecipeItem} style={{ padding: "0.5rem 1rem" }}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "300px", borderLeft: "1px solid var(--border-color)", paddingLeft: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Composición Requerida</h3>
                {builderRecipe.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No has añadido componentes a esta receta aún.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem" }}>
                    {builderRecipe.map((item, idx) => {
                      const ing = state.ingredients.find(i => i.id === item.ingredient_id);
                      return (
                        <li key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
                          <span>{ing?.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontWeight: 700 }}>{item.quantity} {ing?.unit}</span>
                            <button onClick={() => handleRemoveRecipeItem(idx)} style={{ background: "none", border: "none", color: "var(--warning)", cursor: "pointer", fontSize: "1.25rem" }}>
                              ×
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                
                <button className="btn-primary" style={{ width: "100%", backgroundColor: editingProductId ? "var(--accent-color)" : "var(--success)" }} disabled={builderRecipe.length === 0 || !productName} onClick={handleSaveProduct}>
                  {editingProductId ? "Guardar Cambios al Platillo" : "Publicar Platillo al Menú Principal"}
                </button>
              </div>
              
            </div>
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
                          {ing ? ing.name : "Insumo Desconocido"}
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

      </main>
    </div>
  );
}
