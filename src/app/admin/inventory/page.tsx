"use client";
import Link from "next/link";
import { useState } from "react";
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

  // Calculo de Stats para el Dashboard Express
  const totalInventoryValue = state.ingredients.reduce((acc, ing) => acc + (ing.stock * ing.cost_per_unit), 0);
  const lowStockItems = state.ingredients.filter(ing => {
    if (ing.unit === "g" && ing.stock < 1000) return true;
    if (ing.unit === "u" && ing.stock < 20) return true;
    if (ing.unit === "ml" && ing.stock < 500) return true;
    return false;
  }).length;
  const lastMovement = state.inventoryLogs && state.inventoryLogs.length > 0 ? state.inventoryLogs[state.inventoryLogs.length - 1] : null;

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || addedQty <= 0) return;
    updateIngredientStock(selectedIngredient, addedQty);
    setAddedQty(0);
    setSelectedIngredient("");
    setAddedCost("");
  };

  const handleAddNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName || newIngCost <= 0) return;
    addIngredient({
      id: "i_" + Math.random().toString(36).substr(2, 6),
      name: newIngName,
      unit: newIngUnit,
      cost_per_unit: newIngCost,
      stock: 0
    });
    setNewIngName("");
    setNewIngCost(0);
  };

  const handleSaveEdit = (id: string) => {
    editIngredient(id, { name: editName, cost_per_unit: editCost, stock: editStock, unit: editUnit });
    setEditingId(null);
  };

  const getStockStatus = (ing: any) => {
    if (ing.stock <= 0) return { label: "Agotado", className: "pill-danger" };
    if (ing.unit === "g" && ing.stock < 2000) return { label: "Bajo", className: "pill-warning" };
    if (ing.unit === "u" && ing.stock < 25) return { label: "Bajo", className: "pill-warning" };
    return { label: "Saludable", className: "pill-healthy" };
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar Unificado */}
      <aside style={{ width: "260px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--accent-color)", letterSpacing: "1px" }}>BRASA ADMIN</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="/admin" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Dashboard Central</Link>
          <Link href="/admin/orders" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Historial de Pedidos</Link>
          <Link href="/admin/inventory" className="sidebar-link active" style={{ backgroundColor: "rgba(255, 90, 31, 0.1)", color: "var(--accent-color)", borderLeft: "3px solid var(--accent-color)", padding: "0.8rem 1rem", borderRadius: "4px" }}>Inventario (BOM)</Link>
          <Link href="/admin/pricing" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/finances" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Finanzas</Link>
          <Link href="/admin/settings" className="sidebar-link" style={{ padding: "0.8rem 1rem", color: "var(--text-muted)" }}>Configuración</Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "3rem", overflowY: "auto" }}>
        <header style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-1px" }}>Inventario Estratégico</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Gestión SaaS de materia prima y trazabilidad de insumos.</p>
        </header>

        {/* Dashboard Express (Quick Stats) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--success)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Valorización Total</p>
                <h3 style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.5rem" }}>L {totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--accent-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Alertas Criticas</p>
                    <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.5rem", color: lowStockItems > 0 ? "var(--accent-color)" : "inherit" }}>{lowStockItems} Items</h3>
            </div>
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid var(--text-muted)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Último Movimiento</p>
                <div style={{ marginTop: "0.5rem" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{lastMovement ? lastMovement.reason : "Sin registro"}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{lastMovement ? new Date(lastMovement.date).toLocaleDateString() : "---"}</p>
                </div>
            </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)" }}>
            {["stock", "management", "builder", "kardex"].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    style={{ 
                        padding: "1rem 0", color: activeTab === tab ? "var(--accent-color)" : "var(--text-muted)",
                        fontWeight: 700, borderBottom: activeTab === tab ? "3px solid var(--accent-color)" : "3px solid transparent",
                        transition: "all 0.2s", fontSize: "0.9375rem"
                    }}
                >
                    {tab === "stock" ? "Existencias" : tab === "management" ? "Ingresos Logísticos" : tab === "builder" ? "Recetas (BOM)" : "Auditoría Kardex"}
                </button>
            ))}
        </div>

        {/* Existencias Table -> elevated rows style */}
        {activeTab === "stock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "0 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                    <div>Insumo / Materia Prima</div>
                    <div>Stock Actual</div>
                    <div>Status</div>
                    <div style={{ textAlign: "right" }}>Costo Unitario</div>
                    <div style={{ textAlign: "right" }}>Valor en Bodega</div>
                </div>
                {state.ingredients.map((ing) => {
                    const status = getStockStatus(ing);
                    return (
                        <div key={ing.id} className="glass-panel" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "1.5rem", alignItems: "center", transition: "transform 0.2s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "40px", height: "40px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    {ing.unit === "g" ? "🥩" : ing.unit === "ml" ? "🥤" : "🍞"}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>{ing.name}</h4>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {ing.id}</p>
                                </div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                                {ing.stock.toLocaleString()} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ing.unit}</span>
                            </div>
                            <div>
                                <span className={`pill ${status.className}`}>{status.label}</span>
                            </div>
                            <div style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>
                                L {ing.cost_per_unit.toFixed(2)}
                            </div>
                            <div style={{ textAlign: "right", fontWeight: 900, color: "var(--success)", fontSize: "1.1rem" }}>
                                L {(ing.stock * ing.cost_per_unit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Formularios compactos para las otras pestañas */}
        {activeTab === "management" && (
            <div className="glass-panel" style={{ padding: "3rem", maxWidth: "600px" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "2rem" }}>Registrar Ingreso de Materia Prima</h2>
                <form onSubmit={handleAddStock} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.875rem" }}>Insumo a Cargar</label>
                        <select className="input-field" style={{ width: "100%" }} value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)}>
                            <option value="">Seleccione Insumo...</option>
                            {state.ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.875rem" }}>Cantidad Ingresada</label>
                        <input className="input-field" type="number" placeholder="Ej. 1000" value={addedQty || ""} onChange={e => setAddedQty(Number(e.target.value))} />
                    </div>
                    <button className="btn-primary" style={{ marginTop: "1rem" }}>Confirmar Entrada Logística</button>
                </form>
            </div>
        )}
      </main>
    </div>
  );
}
