"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";

export default function PricingDashboard() {
  const { state, hydrated, editProduct } = useAppState();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"metrics" | "catalog">("metrics");
  
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Admin */}
      <aside style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "2rem", color: "var(--accent-color)" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/admin" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Ventas</Link>
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Gestión de Costos/Precios</Link>
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
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Catálogo y Rentabilidad</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Métricas económicas detalladas y opciones visuales del Menú Digital.
          </p>
        </header>

        {/* Pill Tabs Navigation */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-secondary)", padding: "0.5rem", borderRadius: "100px", width: "fit-content", border: "1px solid var(--border-color)" }}>
          <button 
            onClick={() => setActiveTab("metrics")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "metrics" ? "var(--accent-color)" : "transparent",
              color: activeTab === "metrics" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            📊 Gestión de Precios y Costos
          </button>
          <button 
            onClick={() => setActiveTab("catalog")}
            style={{ 
              padding: "0.75rem 1.5rem", borderRadius: "100px", fontWeight: 600, fontSize: "0.875rem", transition: "var(--transition-fast)",
              backgroundColor: activeTab === "catalog" ? "var(--accent-color)" : "transparent",
              color: activeTab === "catalog" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer"
            }}
          >
            📸 Imágenes y Menú Digital
          </button>
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
                      <p style={{ fontWeight: 800, fontSize: "1.125rem" }}>L {recipeCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>PRECIO VENTA</p>
                      <p style={{ fontWeight: 800, color: "var(--accent-color)", fontSize: "1.125rem" }}>L {salesPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>MARGEN</p>
                      <p style={{ fontWeight: 800, color: marginPercent > 40 ? "var(--success)" : "var(--warning)", fontSize: "1.125rem" }}>{marginPercent.toFixed(1)}%</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "40px" }}>
                      <button 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", opacity: 0.6, transition: "transform 0.2s, opacity 0.2s" }}
                        onMouseOver={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.transform = "scale(1)"; }}
                        onClick={(e) => { e.stopPropagation(); setTempName(product.name); setEditingNameId(product.id); }}
                        title="Editar nombre del platillo"
                      >
                        ✏️
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
                                <td style={{ textAlign: "right" }}>L {req.unitCost.toFixed(2)}</td>
                                <td style={{ textAlign: "right", fontWeight: 700 }}>L {req.subtotal.toFixed(2)}</td>
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
                              <td style={{ textAlign: "right", padding: "1rem", fontWeight: 800, fontSize: "1.125rem" }}>L {recipeCost.toFixed(2)}</td>
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
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit}) - L{ing.cost_per_unit.toFixed(2)}</option>
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
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success)" }}>L {grossProfit.toFixed(2)}</span>
                      </div>
                      
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>FOOD COST %</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: foodCostPercent > 40 ? "var(--warning)" : "var(--accent-color)" }}>{foodCostPercent.toFixed(1)}%</span>
                      </div>

                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>DESCRIPCIÓN (CARTA MENÚ)</span>
                        <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-secondary)" }}>
                          "{product.description}"
                        </p>
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
                <div style={{ height: "200px", backgroundColor: "var(--bg-tertiary)", position: "relative", backgroundImage: `url(${product.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                  {!product.is_active && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ backgroundColor: "var(--warning)", color: "var(--bg-primary)", fontWeight: 800, padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)" }}>INACTIVO (OCULTO)</span>
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
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>CATEGORÍA</label>
                        <input type="text" className="input-field" value={tempCategory} onChange={e => setTempCategory(e.target.value)} style={{ padding: "0.5rem", fontSize: "0.875rem" }} />
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

      </main>
    </div>
  );
}
