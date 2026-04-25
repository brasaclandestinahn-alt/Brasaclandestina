"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { generateId } from "@/lib/idHelper";
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
    uploadProductImage,
    signOut 
  } = useAppState();
  const foodCostTarget = state.config?.food_cost_target ?? 35;
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"metrics" | "catalog" | "builder" | "categories">("metrics");
  
  // Quick Edit State
  const [addFormActiveId, setAddFormActiveId] = useState<string>("");
  const [editingQtyKey, setEditingQtyKey] = useState<string>("");
  const [tempQty, setTempQty] = useState<string>("");
  const [newIngId, setNewIngId] = useState<string>("");
  const [newIngQty, setNewIngQty] = useState<number>(1);
  
  // Inline Edit Name State
  const [editingNameId, setEditingNameId] = useState<string>("");
  const [tempName, setTempName] = useState<string>("");

  // Inline Edit Price State
  const [editingPriceId, setEditingPriceId] = useState<string>("");
  const [tempPrice, setTempPrice] = useState<string>("");

  // Catalog Edit State
  const [editingCatalogId, setEditingCatalogId] = useState<string>("");
  const [tempUrl, setTempUrl] = useState<string>("");
  const [tempCategory, setTempCategory] = useState<string>("");
  const [tempDescription, setTempDescription] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Senior Implementation: Client-side resizing and compression
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const MAX_WIDTH = 1080; // Optimized for High-Res Digital Menu
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a Blob binario para carga directa
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: "image/webp" });
            setSelectedFile(resizedFile);
            
            // Usamos base64 SOLO para la preview inmediata (evita problemas de CSP blob:)
            const previewUrl = canvas.toDataURL("image/webp", 0.5);
            setTempUrl(previewUrl); 
            console.log("Preview generada con éxito.");
          }
        }, "image/webp", 0.8);
      };
      if (typeof event.target?.result === "string") img.src = event.target.result;
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

  const handleUpdateIngredientQty = (
    productId: string, 
    ingredientId: string, 
    newQty: number
  ) => {
    if (isNaN(newQty) || newQty <= 0) return;
    
    const product = state.products.find(p => p.id === productId);
    if (!product || !product.recipe) return;
    
    const updatedRecipe = product.recipe.map(item => 
      item.ingredient_id === ingredientId 
        ? { ...item, quantity: newQty } 
        : item
    );
    
    editProduct(productId, { recipe: updatedRecipe });
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
        id: generateId("p_"),
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
                <div style={{ 
                  padding: "1.25rem 1.5rem", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  cursor: "pointer",
                  flexWrap: "wrap",
                  gap: "1rem",
                  backgroundColor: isExpanded ? "var(--bg-tertiary)" : "transparent"
                }} onClick={() => toggleRow(product.id)}>
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
                          {product.name}
                        </h3>
                      )}
                      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "400px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {recipeDetails.length > 0 ? recipeDetails.map(r => r.name).join(" | ") : "Sin insumos asignados"}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    gap: "clamp(0.75rem, 2vw, 2rem)", 
                    flexWrap: "wrap",
                    justifyContent: "flex-end", 
                    textAlign: "right",
                    alignItems: "center"
                  }}>
                    <div className="hide-mobile">
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>COSTO RECETA</p>
                      <p style={{ fontWeight: 800, fontSize: "1.125rem", whiteSpace: "nowrap" }}>{formatCurrency(recipeCost)}</p>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                        PRECIO VENTA
                      </p>

                      {editingPriceId === product.id ? (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          marginTop: "2px"
                        }}>
                          <span style={{
                            fontSize: "0.85rem", fontWeight: 700,
                            color: "var(--accent-color)"
                          }}>L.</span>
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={e => setTempPrice(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const newPrice = parseFloat(tempPrice);
                                if (!isNaN(newPrice) && newPrice > 0) {
                                  editProduct(product.id, { price: newPrice });
                                }
                                setEditingPriceId("");
                              }
                              if (e.key === "Escape") {
                                setEditingPriceId("");
                              }
                            }}
                            onBlur={() => {
                              const newPrice = parseFloat(tempPrice);
                              if (!isNaN(newPrice) && newPrice > 0) {
                                editProduct(product.id, { price: newPrice });
                              }
                              setEditingPriceId("");
                            }}
                            autoFocus
                            style={{
                              width: "90px",
                              fontSize: "1.1rem",
                              fontWeight: 800,
                              color: "var(--accent-color)",
                              background: "var(--bg-tertiary)",
                              border: "1px solid var(--accent-color)",
                              borderRadius: "6px",
                              padding: "2px 6px",
                              outline: "none"
                            }}
                          />
                        </div>
                      ) : (
                        <p
                          style={{
                            fontWeight: 800, color: "var(--accent-color)",
                            fontSize: "1.125rem", whiteSpace: "nowrap",
                            cursor: "pointer",
                            borderBottom: "1px dashed rgba(232,96,60,0.4)",
                            display: "inline-block",
                            paddingBottom: "1px"
                          }}
                          onClick={() => {
                            setTempPrice(product.price.toString());
                            setEditingPriceId(product.id);
                          }}
                          title="Click para editar el precio"
                        >
                          {formatCurrency(salesPrice)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>MARGEN</p>
                      <p title={`Objetivo Food Cost: ≤${foodCostTarget}%`}
                         style={{ 
                           fontWeight: 800, 
                           color: marginPercent >= (100 - foodCostTarget) ? "var(--success)" : "var(--warning)", 
                           fontSize: "1.125rem" 
                         }}>
                        {marginPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", minWidth: "64px" }}>
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
                      <div style={{ marginBottom: "1rem" }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                          📦 Composición de la Receta
                        </h4>
                        <p style={{ 
                          fontSize: "0.7rem", 
                          color: "var(--text-muted)", 
                          margin: "4px 0 0",
                          fontStyle: "italic"
                        }}>
                          Click en la cantidad para editarla. Enter o salir del campo guarda automáticamente.
                        </p>
                      </div>
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
                                <td style={{ textAlign: "center" }}>
                                  {editingQtyKey === `${product.id}-${req.ingredient_id}` ? (
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={tempQty}
                                      onChange={e => setTempQty(e.target.value)}
                                      onBlur={() => {
                                        const newQty = parseFloat(tempQty);
                                        if (!isNaN(newQty) && newQty > 0 && newQty !== req.qty) {
                                          handleUpdateIngredientQty(
                                            product.id, 
                                            req.ingredient_id || "", 
                                            newQty
                                          );
                                        }
                                        setEditingQtyKey("");
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") {
                                          const newQty = parseFloat(tempQty);
                                          if (!isNaN(newQty) && newQty > 0 && newQty !== req.qty) {
                                            handleUpdateIngredientQty(
                                              product.id, 
                                              req.ingredient_id || "", 
                                              newQty
                                            );
                                          }
                                          setEditingQtyKey("");
                                        }
                                        if (e.key === "Escape") {
                                          setEditingQtyKey("");
                                        }
                                      }}
                                      autoFocus
                                      onClick={e => e.stopPropagation()}
                                      style={{
                                        width: "70px",
                                        textAlign: "center",
                                        padding: "4px 6px",
                                        fontSize: "0.9rem",
                                        fontWeight: 700,
                                        color: "var(--accent-color)",
                                        background: "var(--bg-tertiary)",
                                        border: "1px solid var(--accent-color)",
                                        borderRadius: "6px",
                                        outline: "none"
                                      }}
                                    />
                                  ) : (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTempQty(req.qty.toString());
                                        setEditingQtyKey(`${product.id}-${req.ingredient_id}`);
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        borderBottom: "1px dashed rgba(232, 89, 60, 0.4)",
                                        display: "inline-block",
                                        fontWeight: 600,
                                        transition: "all 150ms"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(232, 89, 60, 0.1)";
                                        e.currentTarget.style.borderBottomColor = "var(--accent-color)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderBottomColor = "rgba(232, 89, 60, 0.4)";
                                      }}
                                      title="Click para editar la cantidad"
                                    >
                                      {req.qty}
                                    </span>
                                  )}
                                </td>
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
                    <div style={{ 
                      flex: 1, 
                      minWidth: "250px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "1rem",
                      position: "sticky",
                      top: "80px",
                      alignSelf: "flex-start"
                    }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        📊 Métricas Económicas
                      </h4>
                      
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>UTILIDAD BRUTA</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success)", whiteSpace: "nowrap" }}>{formatCurrency(grossProfit)}</span>
                      </div>
                      
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>FOOD COST %</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: foodCostPercent > foodCostTarget ? "var(--warning)" : "var(--success)" }}>{foodCostPercent.toFixed(1)}%</span>
                      </div>

                      <div style={{ 
                        padding: "1rem", 
                        border: `1px solid ${foodCostPercent > foodCostTarget ? "rgba(232,96,60,0.3)" : "rgba(34,197,94,0.3)"}`,
                        borderRadius: "var(--radius-md)", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        background: foodCostPercent > foodCostTarget ? "rgba(232,96,60,0.05)" : "rgba(34,197,94,0.05)"
                      }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>OBJETIVO</span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: foodCostPercent > foodCostTarget ? "var(--warning)" : "var(--success)" }}>
                            {foodCostPercent > foodCostTarget ? "⚠ Sobre límite" : "✓ Dentro del límite"}
                          </span>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                            Meta: ≤{foodCostTarget}% · Actual: {foodCostPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }}>DESCRIPCIÓN (CARTA MENÚ)</span>
                        {editingCatalogId === `desc_${product.id}` ? (
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "0.75rem", 
                            animation: "fadeIn 0.2s" 
                          }}>
                            <textarea
                              className="input-field"
                              value={tempDescription}
                              onChange={e => setTempDescription(e.target.value)}
                              placeholder="Describe el platillo tal como aparecerá en el menú digital..."
                              style={{ 
                                padding: "0.5rem", 
                                fontSize: "0.875rem", 
                                height: "80px", 
                                resize: "vertical",
                                borderColor: "var(--accent-color)"
                              }}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                  editProduct(product.id, { description: tempDescription });
                                  setEditingCatalogId("");
                                }
                                if (e.key === "Escape") {
                                  setEditingCatalogId("");
                                }
                              }}
                            />
                            <p style={{ 
                              fontSize: "0.65rem", 
                              color: "var(--text-muted)", 
                              margin: 0,
                              fontStyle: "italic"
                            }}>
                              Tip: ⌘+Enter para guardar · Esc para cancelar
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => {
                                  editProduct(product.id, { description: tempDescription });
                                  setEditingCatalogId("");
                                }}
                                style={{ 
                                  flex: 1, 
                                  padding: "0.6rem 0.5rem", 
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  background: "#22c55e",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "var(--radius-sm)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)"
                                }}
                              >
                                💾 Guardar descripción
                              </button>
                              <button
                                onClick={() => setEditingCatalogId("")}
                                style={{ 
                                  padding: "0.6rem 0.75rem", 
                                  fontSize: "0.8rem",
                                  background: "transparent",
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "var(--radius-sm)",
                                  cursor: "pointer",
                                  fontWeight: 600
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "0.75rem", minHeight: "40px" }}>
                              "{product.description || "Sin descripción. Haz clic en Editar para agregar."}"
                            </p>
                            <button
                              onClick={() => {
                                setTempDescription(product.description || "");
                                setEditingCatalogId(`desc_${product.id}`);
                              }}
                              style={{ 
                                background: "none", 
                                border: "1px solid rgba(232, 89, 60, 0.4)", 
                                padding: "0.5rem 1rem", 
                                borderRadius: "var(--radius-sm)", 
                                color: "var(--accent-color)", 
                                cursor: "pointer", 
                                fontSize: "0.78rem", 
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 150ms"
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(232, 89, 60, 0.08)";
                                e.currentTarget.style.borderColor = "var(--accent-color)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "none";
                                e.currentTarget.style.borderColor = "rgba(232, 89, 60, 0.4)";
                              }}
                            >
                              ✏️ Editar descripción
                            </button>
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
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
            animation: "fadeIn 0.3s ease-in-out"
          }}>
            {state.products.length === 0 ? (
              <div style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "4rem 2rem",
                color: "var(--text-muted)"
              }}>
                <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>📦</p>
                <p style={{ 
                  fontWeight: 700, fontSize: "1.1rem", 
                  margin: "0 0 0.5rem", color: "var(--text-primary)" 
                }}>
                  No hay productos en el catálogo
                </p>
                <p style={{ fontSize: "0.85rem", margin: 0 }}>
                  Crea tu primer producto desde el tab 
                  "Constructor de Recetas".
                </p>
              </div>
            ) : (
              state.products.map(product => (
                <div key={product.id} className="glass-panel"
                  style={{ 
                    width: "100%",
                    display: "flex", 
                    flexDirection: "column", 
                    borderRadius: "var(--radius-lg)", 
                    overflow: "hidden" 
                  }}>
                  <div style={{ 
                    aspectRatio: "16/9",
                    backgroundColor: "var(--bg-tertiary)", 
                    position: "relative",
                    overflow: "hidden"
                  }}>
                  <img 
                    src={(editingCatalogId === product.id && tempUrl) ? tempUrl : product.image_url} 
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: savingId === product.id ? 0.3 : 1,
                      transition: "opacity 0.3s ease"
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      // Evitar bucles infinitos si el fallback también falla
                      if (img.src.includes("fallback_active")) return;
                      
                      console.warn("Imagen no cargó, aplicando fallback:", product.name);
                      const cat = product.category?.toLowerCase() || "";
                      let fallback = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"; // General Burger
                      
                      if (cat.includes("alita") || cat.includes("pollo")) {
                         fallback = "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800";
                      } else if (cat.includes("asado") || cat.includes("carne") || cat.includes("chuleta")) {
                         fallback = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";
                      }
                      
                      img.src = fallback + (fallback.includes('?') ? '&' : '?') + "fallback_active=true";
                    }}
                  />
                  {savingId === product.id && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(4px)", zIndex: 10 }}>
                        <div style={{ width: "30px", height: "30px", border: "3px solid #ff6b00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ff6b00", marginTop: "0.5rem" }}>SUBIENDO...</span>
                    </div>
                  )}
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
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            style={{ display: "none" }} 
                            accept="image/*" 
                          />
                          <button 
                            className="btn-primary" 
                            style={{ flex: 1, backgroundColor: "var(--accent-color)" }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            📂 CARGAR
                          </button>
                          
                          <div style={{ 
                            width: "80px", 
                            height: "60px", 
                            borderRadius: "var(--radius-sm)", 
                            backgroundColor: "#f3f4f6", 
                            border: "1px solid #e5e7eb",
                            position: "relative",
                            overflow: "hidden"
                          }}>
                            {(tempUrl || product.image_url) ? (
                              <>
                                <img src={tempUrl || product.image_url} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                {tempUrl && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setTempUrl(""); setSelectedFile(null); }}
                                    style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                  >✕</button>
                                )}
                              </>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: "0.7rem" }}>Sin foto</div>
                            )}
                          </div>
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
                      
                      <div style={{ marginTop: "0.5rem" }}>
                        <button 
                          type="button"
                          onClick={() => alert(`URL Técnica: ${product.image_url || 'Ninguna'}`)}
                          style={{ fontSize: "0.6rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}
                        >
                          🔍 Ver enlace técnico de imagen
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                        <button 
                          className="btn-primary" 
                          style={{ 
                            flex: 2, 
                            backgroundColor: "var(--accent-color)", 
                            color: "white", 
                            fontWeight: 700,
                            border: "none"
                          }} 
                          onClick={async () => {
                            if (!tempUrl && !product.image_url) {
                                alert("Por favor, selecciona una imagen primero.");
                                return;
                            }
                            
                            setIsSaving(true);
                            setSavingId(product.id);
                            
                            let finalUrl = tempUrl || product.image_url;
                            
                            try {
                                // Si hay un archivo seleccionado, subirlo primero a Storage
                                if (selectedFile) {
                                    console.log("Iniciando subida de archivo binario...");
                                    const fileName = `product_${product.id}_${Date.now()}.webp`;
                                    
                                    // Esta función ahora lanza errores descriptivos
                                    const publicUrl = await uploadProductImage(selectedFile, fileName);
                                    
                                    if (publicUrl) {
                                        finalUrl = `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                                        console.log("Archivo subido con éxito. URL:", finalUrl);
                                    }
                                }

                                const result = await editProduct(product.id, { 
                                    image_url: finalUrl, 
                                    category: tempCategory, 
                                    description: tempDescription 
                                });
                                
                                if (result?.success) {
                                    setEditingCatalogId("");
                                    setTempUrl("");
                                    setSelectedFile(null);
                                    // Notificación de éxito
                                    console.log("Producto actualizado con éxito");
                                } else {
                                    alert("Error al actualizar la base de datos.");
                                }
                            } catch (error) {
                                console.error("Error en proceso de guardado:", error);
                                alert("Error crítico: " + (error instanceof Error ? error.message : "Falla al subir imagen. ¿Ya creaste el bucket 'products' en Supabase Storage?"));
                            } finally {
                                setIsSaving(false);
                                setSavingId(null);
                            }
                          }}
                          disabled={isSaving}
                        >
                          {isSaving ? "⏳ PROCESANDO..." : "💾 GUARDAR CAMBIOS"}
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ 
                            flex: 1, 
                            backgroundColor: "#f3f4f6", 
                            color: "#4b5563", 
                            border: "1px solid #e5e7eb",
                            fontWeight: 600
                          }} 
                          onClick={() => setEditingCatalogId("")}
                        >
                          CANCELAR
                        </button>
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
                      <a 
                        href={`/menu/${product.id}`}
                        target="_blank"
                        className="btn-primary"
                        style={{ 
                          width: "100%", 
                          fontSize: "0.8rem", 
                          padding: "0.5rem", 
                          backgroundColor: "transparent", 
                          border: "1px solid var(--accent-red)", 
                          color: "var(--accent-red)",
                          textAlign: "center",
                          textDecoration: "none",
                          marginTop: "0.5rem"
                        }}
                      >
                        👁️ Ver Página Pública (SEO)
                      </a>
                    </>
                  )}
                </div>
              </div>
            )))}
          </div>
        )}
        {/* TAB 3: CONSTRUCTOR DE RECETAS (BOM) */}
        {activeTab === "builder" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div style={{ 
              marginBottom: "2rem", 
              display: "flex", 
              alignItems: "center", 
              gap: "1rem",
              flexWrap: "wrap"
            }}>
              <label style={{ fontWeight: 600 }}>Seleccionar Acción:</label>
              <select className="input-field" 
                style={{ maxWidth: "100%", flex: 1, padding: "0.5rem" }}
                value={editingProductId} 
                onChange={e => loadProductForEditing(e.target.value)}>
                <option value="">✨ Crear Nuevo Platillo (BOM)</option>
                {state.products.map(p => (
                  <option key={p.id} value={p.id}>✏️ Editar: {p.name}</option>
                ))}
              </select>
            </div>

            <div className="glass-panel builder-grid" style={{ 
              padding: "1.5rem",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)",
              gap: "2rem",
              borderLeft: "4px solid var(--accent-color)",
              alignItems: "start"
            }}>
              {/* Left: Product Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
                  {editingProductId ? "✏️ Editar Platillo" : "🆕 Nuevo Platillo (BOM)"}
                </h2>

                <div>
                  <label style={{ 
                    display: "block", marginBottom: "0.4rem", 
                    fontWeight: 700, fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Nombre del Platillo *
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Asado Mixto, Coca Cola..."
                    value={productName} 
                    onChange={e => setProductName(e.target.value)} 
                    style={{ fontSize: "1rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <label style={{ 
                      display: "block", marginBottom: "0.4rem", 
                      fontWeight: 700, fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Precio de Venta (L) *
                    </label>
                    <input type="number" className="input-field" placeholder="100.00" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                  </div>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontWeight: 700, fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Categoría
                      <button onClick={() => setShowCatManager(true)} style={{ color: "var(--accent-color)", cursor: "pointer", fontSize: "0.75rem", textTransform: "none", letterSpacing: "normal" }}>⚙️ Gestionar</button>
                    </label>
                    <select className="input-field" value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                      <option value="">-- Seleccionar --</option>
                      {state.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ 
                  padding: "1rem", 
                  background: "var(--bg-tertiary)", 
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)"
                }}>
                  <p style={{ 
                    fontWeight: 700, 
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 0.75rem"
                  }}>
                    + Añadir Insumo a la Receta
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 2, minWidth: "160px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Insumo
                      </label>
                      <select 
                        className="input-field" 
                        value={currentBuilderIngredient} 
                        onChange={e => setCurrentBuilderIngredient(e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">Seleccionar insumo...</option>
                        {state.ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit}) — L. {ing.cost_per_unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: "0 0 80px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Cantidad
                      </label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={currentBuilderQty} 
                        onChange={e => setCurrentBuilderQty(Number(e.target.value))} 
                        style={{ width: "100%", textAlign: "center" }}
                        min="0"
                        step="any"
                      />
                    </div>
                    <button 
                      className="btn-primary" 
                      onClick={handleAddRecipeItem}
                      style={{ 
                        padding: "0.6rem 1.25rem",
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        marginBottom: "0"
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Recipe Preview */}
              <div style={{ 
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                position: "sticky",
                top: "80px"
              }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Composición Requerida</h3>

                {builderRecipe.length === 0 ? (
                  <div style={{ 
                    padding: "2rem 1rem", 
                    textAlign: "center",
                    background: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-color)"
                  }}>
                    <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>🧾</p>
                    <p style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--text-muted)", 
                      margin: 0,
                      lineHeight: 1.5
                    }}>
                      Selecciona insumos desde la izquierda para armar la receta
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                    {builderRecipe.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        background: "var(--bg-secondary)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        gap: "0.5rem"
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontWeight: 700, 
                            fontSize: "0.875rem",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {state.ingredients.find(i => i.id === item.ingredient_id)?.name || "Insumo"}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                            {item.quantity} {state.ingredients.find(i => i.id === item.ingredient_id)?.unit || "u"}
                          </p>
                        </div>
                        <span style={{ 
                          fontWeight: 800, 
                          color: "var(--accent-color)",
                          fontSize: "0.875rem",
                          flexShrink: 0
                        }}>
                          {formatCurrency(
                            item.quantity * (state.ingredients.find(i => i.id === item.ingredient_id)?.cost_per_unit || 0)
                          )}
                        </span>
                        <button 
                          onClick={() => setBuilderRecipe(prev => prev.filter((_, i) => i !== idx))}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "var(--text-muted)", 
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: "0 4px",
                            flexShrink: 0,
                            lineHeight: 1,
                            transition: "color 150ms"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--warning)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {builderRecipe.length > 0 && (
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        background: "var(--bg-tertiary)",
                        borderRadius: "var(--radius-sm)",
                        borderTop: "2px solid var(--border-color)",
                        marginTop: "0.5rem"
                      }}>
                        <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                          Costo Total Receta:
                        </span>
                        <span style={{ fontWeight: 800, color: "var(--accent-color)", fontSize: "1rem" }}>
                          {formatCurrency(builderRecipe.reduce((acc, item) => {
                            const ing = state.ingredients.find(i => i.id === item.ingredient_id);
                            return acc + (item.quantity * (ing?.cost_per_unit || 0));
                          }, 0))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="btn-primary" 
                  onClick={handleSaveProduct}
                  disabled={isSaving || !productName.trim()}
                  style={{ 
                    width: "100%",
                    padding: "0.875rem 1rem",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    backgroundColor: isSaving ? "var(--bg-secondary)" : "var(--accent-color)",
                    color: isSaving ? "var(--text-muted)" : "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: isSaving || !productName.trim() ? "not-allowed" : "pointer",
                    opacity: !productName.trim() ? 0.5 : 1,
                    transition: "all 200ms"
                  }}
                >
                  {isSaving 
                    ? "⏳ Guardando..." 
                    : editingProductId 
                      ? "💾 Guardar cambios al platillo" 
                      : "✅ Crear platillo"}
                </button>

                {editingProductId && (
                  <button
                    onClick={() => {
                      setEditingProductId("");
                      setProductName("");
                      setProductPrice("");
                      setProductCategory("");
                      setBuilderRecipe([]);
                    }}
                    style={{ 
                      width: "100%",
                      padding: "0.6rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: "none",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      marginTop: "0.25rem"
                    }}
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
          <div style={{ animation: "fadeIn 0.3s ease-in-out", maxWidth: "860px" }}>
            
            {/* Header con contador */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                  Categorías del Menú
                </h2>
                <p style={{ 
                  fontSize: "0.8rem", 
                  color: "var(--text-muted)", 
                  margin: "4px 0 0" 
                }}>
                  {state.categories.length} categoría{state.categories.length !== 1 ? "s" : ""} configurada{state.categories.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Formulario inline compacto */}
            <div className="glass-panel" style={{ 
              padding: "1rem 1.25rem", 
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap"
            }}>
              <span style={{ 
                fontSize: "0.8rem", 
                fontWeight: 700, 
                color: "var(--text-muted)",
                whiteSpace: "nowrap"
              }}>
                + Nueva categoría:
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Postres, Bebidas..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCatName.trim()) {
                    addCategory(newCatName.trim());
                    setNewCatName("");
                  }
                }}
                style={{ 
                  flex: 1, 
                  minWidth: "180px", 
                  maxWidth: "320px",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem"
                }}
              />
              <button
                className="btn-primary"
                onClick={() => {
                  if (!newCatName.trim()) return;
                  addCategory(newCatName.trim());
                  setNewCatName("");
                }}
                style={{ 
                  padding: "0.5rem 1.25rem", 
                  fontSize: "0.85rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                Añadir
              </button>
              <p style={{ 
                fontSize: "0.72rem", 
                color: "var(--text-muted)", 
                margin: 0,
                width: "100%"
              }}>
                Tip: Presiona Enter para añadir rápidamente.
              </p>
            </div>

            {/* Lista de categorías */}
            <div className="glass-panel" style={{ 
              padding: 0, 
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)"
            }}>
              {state.categories.length === 0 ? (
                <div style={{ 
                  padding: "3rem", 
                  textAlign: "center", 
                  color: "var(--text-muted)" 
                }}>
                  <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>📂</p>
                  <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>
                    Sin categorías todavía
                  </p>
                  <p style={{ fontSize: "0.8rem", margin: 0 }}>
                    Agrega una categoría usando el formulario de arriba.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ 
                    width: "100%", 
                    textAlign: "left", 
                    borderCollapse: "collapse",
                    minWidth: "400px"
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: "var(--bg-tertiary)", 
                        borderBottom: "1px solid var(--border-color)"
                      }}>
                        <th style={{ 
                          padding: "0.75rem 1.25rem", 
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)"
                        }}>
                          Nombre
                        </th>
                        <th style={{ 
                          padding: "0.75rem 1.25rem", 
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          textAlign: "right",
                          width: "180px"
                        }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.categories.map((cat, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: idx < state.categories.length - 1 
                              ? "1px solid var(--border-color)" 
                              : "none",
                            transition: "background 150ms"
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--bg-secondary)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "0.875rem 1.25rem" }}>
                            {editingCat === cat ? (
                              <input
                                className="input-field"
                                value={renamingCatTo}
                                onChange={(e) => setRenamingCatTo(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (renamingCatTo.trim() && renamingCatTo !== cat) {
                                      updateCategory(cat, renamingCatTo.trim());
                                    }
                                    setEditingCat(null);
                                  }
                                  if (e.key === "Escape") setEditingCat(null);
                                }}
                                style={{ 
                                  maxWidth: "280px",
                                  padding: "0.35rem 0.6rem",
                                  fontSize: "0.875rem"
                                }}
                                autoFocus
                              />
                            ) : (
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.75rem" 
                              }}>
                                <span style={{ 
                                  width: "8px", 
                                  height: "8px", 
                                  borderRadius: "50%", 
                                  background: "var(--accent-color)",
                                  flexShrink: 0
                                }} />
                                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                  {cat}
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ 
                            padding: "0.875rem 1.25rem", 
                            textAlign: "right" 
                          }}>
                            {editingCat === cat ? (
                              <div style={{ 
                                display: "flex", 
                                gap: "0.5rem", 
                                justifyContent: "flex-end" 
                              }}>
                                <button
                                  className="btn-primary"
                                  style={{ 
                                    padding: "0.4rem 0.875rem", 
                                    fontSize: "0.78rem",
                                    backgroundColor: "var(--success)"
                                  }}
                                  onClick={() => {
                                    if (renamingCatTo.trim() && renamingCatTo !== cat) {
                                      updateCategory(cat, renamingCatTo.trim());
                                    }
                                    setEditingCat(null);
                                  }}
                                >
                                  ✔ Guardar
                                </button>
                                <button
                                  style={{ 
                                    padding: "0.4rem 0.875rem", 
                                    fontSize: "0.78rem",
                                    background: "none",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "var(--radius-sm)",
                                    color: "var(--text-muted)",
                                    cursor: "pointer"
                                  }}
                                  onClick={() => setEditingCat(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div style={{ 
                                display: "flex", 
                                gap: "0.5rem", 
                                justifyContent: "flex-end",
                                alignItems: "center"
                              }}>
                                <button
                                  onClick={() => { 
                                    setEditingCat(cat); 
                                    setRenamingCatTo(cat); 
                                  }}
                                  style={{ 
                                    background: "none",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "var(--radius-sm)",
                                    padding: "0.35rem 0.75rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    cursor: "pointer",
                                    transition: "all 150ms"
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--accent-color)";
                                    e.currentTarget.style.color = "var(--accent-color)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--border-color)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                  }}
                                >
                                  ✏️ Renombrar
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(
                                      `¿Eliminar la categoría "${cat}"?\n\nLos productos de esta categoría quedarán sin categoría asignada.`
                                    )) {
                                      removeCategory(cat);
                                    }
                                  }}
                                  style={{ 
                                    background: "none",
                                    border: "1px solid transparent",
                                    borderRadius: "var(--radius-sm)",
                                    padding: "0.35rem 0.5rem",
                                    fontSize: "0.875rem",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                    transition: "all 150ms"
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = "var(--warning)";
                                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.borderColor = "transparent";
                                  }}
                                  title={`Eliminar categoría "${cat}"`}
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
              )}
            </div>

            {/* Nota informativa */}
            <p style={{ 
              fontSize: "0.75rem", 
              color: "var(--text-muted)", 
              marginTop: "0.75rem",
              textAlign: "center"
            }}>
              El orden de las categorías aquí es el mismo que aparece en el menú digital.
            </p>
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
