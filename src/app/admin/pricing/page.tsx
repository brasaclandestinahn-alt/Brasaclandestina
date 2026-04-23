"use client";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";

export default function PricingDashboard() {
  const { 
    state, 
    hydrated, 
    editProduct, 
    removeProduct, 
    addProductWithRecipe, 
    addCategory,
    removeCategory,
    updateCategory,
    signOut 
  } = useAppState();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"metrics" | "catalog" | "builder" | "categories">("metrics");
  
  // Quick Edit State
  const [addFormActiveId, setAddFormActiveId] = useState<string>("");
  const [newIngId, setNewIngId] = useState<string>("");
  const [newIngQty, setNewIngQty] = useState<number>(1);
  
  // Inline Edit Name State
  const [editingNameId, setEditingNameId] = useState<string>("");
  const [tempName, setTempName] = useState<string>("");

  // Catalog Edit State
  const [editingCatalogId, setEditingCatalogId] = useState<string>("");
  const [tempUrl, setTempUrl] = useState<string>("");
  const [tempCategory, setTempCategory] = useState<string>("");
  const [tempDescription, setTempDescription] = useState<string>("");

  // Recipe Builder State
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [builderRecipe, setBuilderRecipe] = useState<{ingredient_id: string, quantity: number}[]>([]);
  const [currentBuilderIngredient, setCurrentBuilderIngredient] = useState<string>("");
  const [currentBuilderQty, setCurrentBuilderQty] = useState<number>(1);
  
  // Category Manager State
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [renamingCatTo, setRenamingCatTo] = useState("");

  if (!hydrated) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Optimización WebP para localStorage
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", 0.7);
        setTempUrl(dataUrl);
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleRemoveIngredient = (productId: string, ingredientIdToRemove: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product || !product.recipe) return;
    const newRecipe = product.recipe.filter(r => r.ingredient_id !== ingredientIdToRemove);
    editProduct(productId, { recipe: newRecipe });
  };

  const handleAddIngredient = (productId: string) => {
    if (!newIngId || newIngQty <= 0) return alert("Selecciona un insumo y cantidad válida.");
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const currentRecipe = product.recipe || [];
    // check if it already exists to avoid duplicates (could just update qty)
    const existingIdx = currentRecipe.findIndex(r => r.ingredient_id === newIngId);
    let newRecipe = [...currentRecipe];
    
    if (existingIdx > -1) {
      newRecipe[existingIdx].quantity += newIngQty;
    } else {
      newRecipe.push({ ingredient_id: newIngId, quantity: newIngQty });
    }

    editProduct(productId, { recipe: newRecipe });
    setAddFormActiveId("");
    setNewIngId("");
    setNewIngQty(1);
  };

  // ── Recipe Builder Handlers ──────────────────────────────────────────────
  const handleAddRecipeItem = () => {
    if (!currentBuilderIngredient || currentBuilderQty <= 0) return;
    setBuilderRecipe(prev => [...prev, { ingredient_id: currentBuilderIngredient, quantity: currentBuilderQty }]);
    setCurrentBuilderQty(1);
    setCurrentBuilderIngredient("");
  };

  const handleRemoveRecipeItem = (index: number) => {
    setBuilderRecipe(prev => prev.filter((_, i) => i !== index));
  };

  const loadProductForEditing = (pid: string) => {
    setEditingProductId(pid);
    if (!pid) {
      setProductName(""); setProductPrice(""); setProductCategory(""); setBuilderRecipe([]);
      return;
    }
    const target = state.products.find(p => p.id === pid);
    if (target) {
      setProductName(target.name);
      setProductPrice(target.price.toString());
      setProductCategory(target.category || "");
      setBuilderRecipe(target.recipe || []);
    }
  };

  const handleSaveProduct = () => {
    if (!productName || !productPrice || builderRecipe.length === 0)
      return alert("Faltan datos o ingredientes.");
    if (editingProductId) {
      editProduct(editingProductId, { name: productName, category: productCategory, price: Number(productPrice), recipe: builderRecipe });
      alert("¡Platillo actualizado correctamente!");
    } else {
      addProductWithRecipe({
        id: "p_" + Math.random().toString(36).substr(2, 6),
        name: productName,
        description: "Agregado desde el constructor de recetas.",
        category: productCategory || "Varios",
        price: Number(productPrice),
        image_url: "/placeholder-burger.webp",
        is_active: true,
        recipe: builderRecipe
      });
      alert("¡Platillo registrado correctamente!");
    }
    setEditingProductId(""); setProductName(""); setProductPrice(""); setProductCategory(""); setBuilderRecipe([]);
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Catálogo y Rentabilidad</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Métricas económicas detalladas y opciones visuales del Menú Digital.
            </p>
          </header>

          {/* Segmented Control Navigation */}
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
              { id: "metrics", label: "Gestión de Precios" },
              { id: "catalog", label: "Imágenes y Menú" },
              { id: "builder", label: "Constructor de Recetas" },
              { id: "categories", label: "Categorías" }
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

        {activeTab === "metrics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease-in-out" }}>
          {state.products.map(product => {
            // Calculating recipe cost
            let recipeCost = 0;
            const recipeDetails = (product.recipe || []).map(r => {
              const ing = state.ingredients.find(i => i.id === r.ingredient_id);
              const costPerUnit = ing ? ing.cost_per_unit : 0;
              const subtotal = r.quantity * costPerUnit;
              recipeCost += subtotal;
              return { 
                ingredient_id: r.ingredient_id,
                name: ing ? ing.name : "Insumo Desconocido", 
                qty: r.quantity, 
                unitCost: costPerUnit, 
                subtotal 
              };
            });

            // Financial Metrics
            const salesPrice = product.price;
            const grossProfit = salesPrice - recipeCost;
            const foodCostPercent = salesPrice > 0 ? (recipeCost / salesPrice) * 100 : 0;
            const marginPercent = salesPrice > 0 ? (grossProfit / salesPrice) * 100 : 0;
            const isExpanded = expandedRows.includes(product.id);

            return (
              <div key={product.id} className="glass-panel" style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                
                {/* Header (Always Visible) */}
                <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", backgroundColor: isExpanded ? "var(--bg-tertiary)" : "transparent" }} onClick={() => toggleRow(product.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 2 }}>
                    <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                      <span style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                    </div>
                    <div>
                      {editingNameId === product.id ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ padding: "0.25rem 0.5rem", fontSize: "1rem", height: "auto" }}
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            autoFocus
                          />
                          <button className="btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: "var(--success)" }} onClick={(e) => {
                            e.stopPropagation();
                            if(tempName.trim() !== "") {
                              editProduct(product.id, { name: tempName });
                            }
                            setEditingNameId("");
                          }}>Guardar</button>
                        </div>
                      ) : (
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {product.name.toUpperCase()}
                        </h3>
                      )}
                      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "400px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {recipeDetails.length > 0 ? recipeDetails.map(r => r.name).join(" | ") : "Sin insumos asignados"}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "3rem", flex: 1, justifyContent: "flex-end", textAlign: "right" }}>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>COSTO RECETA</p>
                      <p style={{ fontWeight: 800, fontSize: "1.125rem", whiteSpace: "nowrap" }}>{formatCurrency(recipeCost)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>PRECIO VENTA</p>
                      <p style={{ fontWeight: 800, color: "var(--accent-color)", fontSize: "1.125rem", whiteSpace: "nowrap" }}>{formatCurrency(salesPrice)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>MARGEN</p>
                      <p style={{ fontWeight: 800, color: marginPercent > 40 ? "var(--success)" : "var(--warning)", fontSize: "1.125rem" }}>{marginPercent.toFixed(1)}%</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1rem", minWidth: "80px" }}>
                      <button 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", opacity: 0.6, transition: "transform 0.2s, opacity 0.2s" }}
                        onMouseOver={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.transform = "scale(1)"; }}
                        onClick={(e) => { e.stopPropagation(); setTempName(product.name); setEditingNameId(product.id); }}
                        title="Editar nombre del platillo"
                      >
                        ✏️
                      </button>
                      <button 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", opacity: 0.6, transition: "transform 0.2s, opacity 0.2s" }}
                        onMouseOver={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.transform = "scale(1)"; }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(confirm(`¿Estás seguro de que deseas eliminar permanentemente "${product.name}"? Esta acción no se puede deshacer.`)) {
                            removeProduct(product.id);
                          }
                        }}
                        title="Eliminar producto permanentemente"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div style={{ display: "flex", flexWrap: "wrap", borderTop: "1px solid var(--border-color)", padding: "1.5rem", gap: "2rem", backgroundColor: "var(--bg-primary)" }}>
                    
                    {/* Contabilidad Receta */}
                    <div style={{ flex: 2, minWidth: "400px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        📦 Composición de la Receta
                      </h4>
                      <table style={{ width: "100%", textAlign: "left", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
                            <th style={{ paddingBottom: "0.5rem", fontWeight: 600 }}>Insumo</th>
                            <th style={{ paddingBottom: "0.5rem", fontWeight: 600, textAlign: "center" }}>Cantidad</th>
                            <th style={{ paddingBottom: "0.5rem", fontWeight: 600, textAlign: "right" }}>Costo Unit.</th>
                            <th style={{ paddingBottom: "0.5rem", fontWeight: 600, textAlign: "right" }}>Subtotal</th>
                            <th style={{ paddingBottom: "0.5rem", fontWeight: 600, textAlign: "center" }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipeDetails.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>Sin receta definida.</td></tr>
                          ) : (
                            recipeDetails.map((req, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px dashed var(--border-color)", height: "3rem" }}>
                                <td style={{ color: "var(--text-primary)" }}>{req.name}</td>
                                <td style={{ textAlign: "center" }}>{req.qty}</td>
                                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(req.unitCost)}</td>
                                <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCurrency(req.subtotal)}</td>
                                <td style={{ textAlign: "center" }}>
                                  <button 
                                    onClick={() => handleRemoveIngredient(product.id, req.ingredient_id || "")}
                                    style={{ background: "none", border: "none", color: "var(--warning)", cursor: "pointer", fontSize: "1rem" }}
                                    title="Quitar Insumo"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {recipeDetails.length > 0 && (
                          <tfoot>
                            <tr>
                              <td colSpan={3} style={{ textAlign: "right", padding: "1rem", fontWeight: 700 }}>Costo Total:</td>
                              <td style={{ textAlign: "right", padding: "1rem", fontWeight: 800, fontSize: "1.125rem", whiteSpace: "nowrap" }}>{formatCurrency(recipeCost)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>

                      {/* Quick Add Form Section */}
                      <div style={{ marginTop: "1rem" }}>
                        {addFormActiveId === product.id ? (
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", animation: "fadeIn 0.2s" }}>
                            <select className="input-field" value={newIngId} onChange={e => setNewIngId(e.target.value)} style={{ flex: 2 }}>
                              <option value="">Seleccionar Insumo...</option>
                              {state.ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit}) - {formatCurrency(ing.cost_per_unit)}</option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              className="input-field" 
                              value={newIngQty} 
                              onChange={e => setNewIngQty(Number(e.target.value))} 
                              style={{ width: "80px" }} 
                              min="1" 
                            />
                            <button className="btn-primary" onClick={() => handleAddIngredient(product.id)} style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)" }}>Guardar</button>
                            <button className="btn-primary" onClick={() => setAddFormActiveId("")} style={{ padding: "0.5rem 1rem", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>Cancelar</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setAddFormActiveId(product.id)}
                            style={{ background: "none", border: "1px dashed var(--accent-color)", padding: "0.5rem 1rem", width: "100%", borderRadius: "var(--radius-md)", color: "var(--accent-color)", cursor: "pointer", fontWeight: 600 }}
                          >
                            + Añadir Componente a la Receta
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Métricas e Info Adicional */}
                    <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        📊 Métricas Económicas
                      </h4>
                      
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>UTILIDAD BRUTA</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success)", whiteSpace: "nowrap" }}>{formatCurrency(grossProfit)}</span>
                      </div>
                      
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>FOOD COST %</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: foodCostPercent > 40 ? "var(--warning)" : "var(--accent-color)" }}>{foodCostPercent.toFixed(1)}%</span>
                      </div>

                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }}>DESCRIPCIÓN (CARTA MENÚ)</span>
                        {editingCatalogId === `desc_${product.id}` ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "fadeIn 0.2s" }}>
                            <textarea
                              className="input-field"
                              value={tempDescription}
                              onChange={e => setTempDescription(e.target.value)}
                              placeholder="Describe el platillo tal como aparecerá en el menú digital..."
                              style={{ padding: "0.5rem", fontSize: "0.875rem", height: "80px", resize: "vertical" }}
                              autoFocus
                            />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                className="btn-primary"
                                style={{ flex: 1, padding: "0.5rem", fontSize: "0.75rem", backgroundColor: "var(--success)" }}
                                onClick={() => {
                                  editProduct(product.id, { description: tempDescription });
                                  setEditingCatalogId("");
                                }}
                              >✔ Guardar</button>
                              <button
                                className="btn-primary"
                                style={{ flex: 1, padding: "0.5rem", fontSize: "0.75rem", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                                onClick={() => setEditingCatalogId("")}
                              >✖ Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "0.75rem", minHeight: "40px" }}>
                              "{product.description || "Sin descripción. Haz clic en Editar para agregar."}"
                            </p>
                            <button
                              style={{ background: "none", border: "1px dashed var(--accent-color)", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-sm)", color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}
                              onClick={() => {
                                setTempDescription(product.description || "");
                                setEditingCatalogId(`desc_${product.id}`);
                              }}
                            >✏️ Editar Descripción</button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
        )}

        {/* TAB 2: CATALOGO VISUAL */}
        {activeTab === "catalog" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", animation: "fadeIn 0.3s ease-in-out" }}>
            {state.products.map(product => (
              <div key={product.id} className="glass-panel" style={{ width: "320px", display: "flex", flexDirection: "column", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ 
                  height: "200px", 
                  backgroundColor: "var(--bg-tertiary)", 
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  {!product.is_active && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
                      <span style={{ backgroundColor: "var(--accent-color)", color: "white", fontWeight: 800, padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", boxShadow: "var(--shadow-md)" }}>OCULTO EN EL MENÚ</span>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{product.name}</h3>
                  
                  {editingCatalogId === product.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "fadeIn 0.2s" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>FOTOGRAFÍA</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id={`file-${product.id}`}
                            style={{ display: "none" }} 
                            onChange={handleImageUpload} 
                          />
                          <button 
                            className="btn-primary" 
                            style={{ flex: 1, backgroundColor: "var(--accent-color)" }}
                            onClick={() => document.getElementById(`file-${product.id}`)?.click()}
                          >
                            📁 Cargar
                          </button>
                          <input 
                            type="text" 
                            className="input-field" 
                            value={tempUrl} 
                            onChange={e => setTempUrl(e.target.value)} 
                            placeholder="/img.jpg o Base64" 
                            style={{ flex: 2, padding: "0.5rem", fontSize: "0.75rem" }} 
                            title="También puedes pegar un URL web si no quieres cargar un archivo"
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                          CATEGORÍA
                          <button onClick={() => setShowCatManager(true)} style={{ color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem" }}>⚙️ Gestionar</button>
                        </label>
                        <select 
                          className="input-field" 
                          value={tempCategory} 
                          onChange={e => setTempCategory(e.target.value)} 
                          style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        >
                          <option value="">-- Seleccionar --</option>
                          {state.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>DESCRIPCIÓN</label>
                        <textarea className="input-field" value={tempDescription} onChange={e => setTempDescription(e.target.value)} style={{ padding: "0.5rem", fontSize: "0.875rem", height: "60px", resize: "none" }} />
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button className="btn-primary" style={{ flex: 1, backgroundColor: "var(--success)" }} onClick={() => {
                          editProduct(product.id, { image_url: tempUrl, category: tempCategory, description: tempDescription });
                          setEditingCatalogId("");
                        }}>Guardar</button>
                        <button className="btn-primary" style={{ flex: 1, backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} onClick={() => setEditingCatalogId("")}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>CATEGORÍA:</span> <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{product.category}</span>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", flex: 1 }}>{product.description}</p>
                      
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                          setTempUrl(product.image_url);
                          setTempCategory(product.category);
                          setTempDescription(product.description);
                          setEditingCatalogId(product.id);
                        }}>Cambiar Imagen/Datos</button>
                        
                        <button 
                          className="btn-primary" 
                          style={{ flex: 1, backgroundColor: product.is_active ? "var(--warning)" : "var(--success)" }}
                          onClick={() => editProduct(product.id, { is_active: !product.is_active })}
                        >
                          {product.is_active ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* TAB 3: CONSTRUCTOR DE RECETAS (BOM) */}
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
              {/* Left: Product Form */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
                  {editingProductId ? "✏️ Editar Platillo" : "🆕 Nuevo Platillo (BOM)"}
                </h2>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre del Producto Terminado</label>
                  <input type="text" className="input-field" placeholder="Ej. Tacos al Pastor" value={productName} onChange={e => setProductName(e.target.value)} />
                </div>

                <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Precio de Venta (L)</label>
                    <input type="number" className="input-field" placeholder="100.00" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontWeight: 600 }}>
                      Categoría
                      <button onClick={() => setShowCatManager(true)} style={{ color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem" }}>⚙️ Gestionar</button>
                    </label>
                    <select className="input-field" value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                      <option value="">-- Seleccionar --</option>
                      {state.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Añadir Insumo a la Receta</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
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

              {/* Right: Recipe Preview */}
              <div style={{ flex: 1, minWidth: "300px", borderLeft: "1px solid var(--border-color)", paddingLeft: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Composición Requerida</h3>

                {builderRecipe.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>No has añadido componentes a esta receta aún.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem" }}>
                    {builderRecipe.map((item, idx) => {
                      const ing = state.ingredients.find(i => i.id === item.ingredient_id);
                      const costLine = ing ? (item.quantity * ing.cost_per_unit) : 0;
                      return (
                        <li key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-color)" }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{ing?.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>({item.quantity} {ing?.unit})</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--accent-color)", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCurrency(costLine)}</span>
                            <button onClick={() => handleRemoveRecipeItem(idx)} style={{ background: "none", border: "none", color: "var(--warning)", cursor: "pointer", fontSize: "1.25rem" }}>×</button>
                          </div>
                        </li>
                      );
                    })}
                    <li style={{ padding: "0.75rem 0", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                      <span style={{ color: "var(--text-muted)" }}>Costo Total Receta:</span>
                      <span style={{ color: "var(--accent-color)", whiteSpace: "nowrap" }}>{formatCurrency(builderRecipe.reduce((acc, item) => {
                        const ing = state.ingredients.find(i => i.id === item.ingredient_id);
                        return acc + (item.quantity * (ing?.cost_per_unit || 0));
                      }, 0))}</span>
                    </li>
                  </ul>
                )}

                <button
                  className="btn-primary"
                  style={{ width: "100%", backgroundColor: editingProductId ? "var(--accent-color)" : "var(--success)", fontSize: "1rem", padding: "1rem" }}
                  disabled={builderRecipe.length === 0 || !productName}
                  onClick={handleSaveProduct}
                >
                  {editingProductId ? "💾 Guardar Cambios al Platillo" : "🚀 Publicar Platillo al Menú Principal"}
                </button>

                {editingProductId && (
                  <button
                    onClick={() => loadProductForEditing("")}
                    style={{ width: "100%", marginTop: "0.75rem", background: "none", border: "1px dashed var(--border-color)", padding: "0.6rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 }}
                  >
                    + Crear nuevo platillo en cambio
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* TAB 4: GESTION DE CATEGORIAS */}
        {activeTab === "categories" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              
              {/* Formulario Nueva Categoría */}
              <div className="glass-panel" style={{ flex: 1, minWidth: "300px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Añadir Nueva Categoría</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Postres" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      if (!newCatName) return;
                      addCategory(newCatName);
                      setNewCatName("");
                    }}
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* Lista de Categorías */}
              <div className="glass-panel" style={{ flex: 2, minWidth: "400px", padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Categorías Existentes</h2>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      <th style={{ padding: "1rem", fontWeight: 600 }}>Nombre</th>
                      <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.categories.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem" }}>
                          {editingCat === cat ? (
                            <input 
                              className="input-field" 
                              value={renamingCatTo} 
                              onChange={(e) => setRenamingCatTo(e.target.value)}
                              style={{ width: "200px" }}
                              autoFocus
                            />
                          ) : (
                            <span style={{ fontWeight: 600 }}>{cat}</span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          {editingCat === cat ? (
                            <button 
                              className="btn-primary" 
                              style={{ padding: "0.5rem 1rem", backgroundColor: "var(--success)" }}
                              onClick={() => {
                                if (renamingCatTo && renamingCatTo !== cat) updateCategory(cat, renamingCatTo);
                                setEditingCat(null);
                              }}
                            >
                              Guardar
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                onClick={() => { setEditingCat(cat); setRenamingCatTo(cat); }}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn-primary" 
                                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", backgroundColor: "var(--warning)" }}
                                onClick={() => {
                                  if (window.confirm(`¿Seguro que deseas eliminar la categoría "${cat}"?`)) {
                                    removeCategory(cat);
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

        {/* Category Manager Modal Overlay */}
        {showCatManager && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
            <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Gestionar Categorías</h2>
                <button onClick={() => setShowCatManager(false)} style={{ fontSize: "1.5rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>×</button>
              </div>

              {/* Add Category */}
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.875rem" }}>Nueva Categoría</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Postres" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                  />
                  <button 
                    className="btn-primary" 
                    onClick={() => { 
                      if(!newCatName) return; 
                      addCategory(newCatName); 
                      setNewCatName(""); 
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Category List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                <label style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-muted)" }}>Categorías Existentes</label>
                {state.categories.map(cat => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    {editingCat === cat ? (
                      <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={renamingCatTo} 
                          onChange={e => setRenamingCatTo(e.target.value)} 
                          autoFocus 
                        />
                        <button className="btn-primary" style={{ backgroundColor: "var(--success)", padding: "0.5rem" }} onClick={() => {
                          if(renamingCatTo && renamingCatTo !== cat) updateCategory(cat, renamingCatTo);
                          setEditingCat(null);
                        }}>✔</button>
                        <button className="btn-primary" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "0.5rem" }} onClick={() => setEditingCat(null)}>✖</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => { setEditingCat(cat); setRenamingCatTo(cat); }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                            title="Renombrar"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => { if(confirm(`¿Eliminar categoría "${cat}"?`)) removeCategory(cat); }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={() => setShowCatManager(false)}>
                Cerrar Panel
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
    </AuthGuard>
  );
}
