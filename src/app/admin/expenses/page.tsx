"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import { Expense } from "@/lib/mockDB";

export default function ExpensesPage() {
  const { state, hydrated, addExpense, editExpense, removeExpense, signOut } = useAppState();
  
  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Insumos");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("pending");

  // Filter State
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!hydrated) return null;

  const totalExpenses = state.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const paidExpenses = state.expenses.filter(e => e.status === "paid").reduce((acc, exp) => acc + exp.amount, 0);
  const pendingExpenses = state.expenses.filter(e => e.status === "pending").reduce((acc, exp) => acc + exp.amount, 0);

  const filteredExpenses = state.expenses
    .filter(e => filterStatus === "all" || e.status === filterStatus)
    .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || (e.provider || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return alert("Descripción y Monto requeridos");
    
    const newExp: Expense = {
      id: "exp_" + Math.random().toString(36).substr(2, 6),
      description,
      amount: Number(amount),
      date: new Date().toISOString(),
      status,
      category,
      provider: provider || undefined
    };

    addExpense(newExp);
    setDescription("");
    setAmount("");
    setProvider("");
    alert("¡Gasto registrado correctamente!");
  };

  const toggleStatus = (id: string, current: string) => {
    editExpense(id, { status: current === "paid" ? "pending" : "paid" });
  };

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el gasto: "${desc}"?`)) {
      removeExpense(id);
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
          <Link href="/admin/inventory" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Inventario (Insumos)</Link>
          <Link href="/admin/pricing" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>Catálogo y Precios</Link>
          <Link href="/admin/expenses" style={{ padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>Gastos</Link>
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
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Gestión de Gastos y Facturas</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Registra y controla el flujo de salida de efectivo por compras de insumos y otros costos operativos.</p>
        </header>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase" }}>Gasto Total Acumulado</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>L {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--success)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase" }}>Total Pagado</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)", marginTop: "0.5rem" }}>L {paidExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", borderTop: "4px solid var(--warning)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem", textTransform: "uppercase" }}>Total Pendiente (Cuentas por Pagar)</h3>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--warning)", marginTop: "0.5rem" }}>L {pendingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "3rem" }}>
          {/* New Expense Form */}
          <div className="glass-panel" style={{ padding: "2rem", flex: 1, minWidth: "350px", borderLeft: "4px solid var(--accent-color)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Registrar Nuevo Gasto</h2>
            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Descripción / Concepto</label>
                <input 
                  type="text" className="input-field" placeholder="Ej. Compra de 50lbs Harina" 
                  value={description} onChange={e => setDescription(e.target.value)} required 
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Monto (L)</label>
                  <input 
                    type="number" className="input-field" placeholder="0.00" step="0.01"
                    value={amount} onChange={e => setAmount(e.target.value)} required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Categoría</label>
                  <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Insumos">Insumos (Materia Prima)</option>
                    <option value="Operativo">Gasto Operativo</option>
                    <option value="Servicios">Servicios Públicos</option>
                    <option value="Personal">Personal / Nómina</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Proveedor (Opcional)</label>
                <input 
                  type="text" className="input-field" placeholder="Nombre de la empresa o persona" 
                  value={provider} onChange={e => setProvider(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Estado Inicial</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="radio" checked={status === "pending"} onChange={() => setStatus("pending")} /> Pendiente
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="radio" checked={status === "paid"} onChange={() => setStatus("paid")} /> Pagado
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem", padding: "1rem" }}>Guardar Gasto</button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="glass-panel" style={{ flex: 2, minWidth: "500px", padding: "0", overflow: "hidden" }}>
             <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Historial de Gastos</h2>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                   <input 
                      type="text" className="input-field" placeholder="Buscar..." 
                      style={{ maxWidth: "200px", padding: "0.5rem" }}
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                   />
                   <select className="input-field" style={{ width: "auto", padding: "0.5rem" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                      <option value="all">Todos los Estados</option>
                      <option value="paid">Pagados</option>
                      <option value="pending">Pendientes</option>
                   </select>
                </div>
             </div>

             <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
               <thead>
                 <tr style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                   <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha</th>
                   <th style={{ padding: "1rem", fontWeight: 600 }}>Descripción</th>
                   <th style={{ padding: "1rem", fontWeight: 600 }}>Categoría</th>
                   <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Monto</th>
                   <th style={{ padding: "1rem", fontWeight: 600, textAlign: "center" }}>Estado</th>
                   <th style={{ padding: "1rem", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredExpenses.length === 0 ? (
                   <tr>
                     <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No se encontraron gastos con estos filtros.</td>
                   </tr>
                 ) : (
                   filteredExpenses.map(exp => (
                     <tr key={exp.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "var(--transition-fast)" }}>
                       <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>{new Date(exp.date).toLocaleDateString()}</td>
                       <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600 }}>{exp.description}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{exp.provider || "Sin proveedor"}</div>
                       </td>
                       <td style={{ padding: "1rem" }}>
                          <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", fontWeight: 700 }}>{exp.category}</span>
                       </td>
                       <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800 }}>L {exp.amount.toFixed(2)}</td>
                       <td style={{ padding: "1rem", textAlign: "center" }}>
                          <button 
                            onClick={() => toggleStatus(exp.id, exp.status)}
                            style={{ 
                              padding: "0.4rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "none",
                              backgroundColor: exp.status === "paid" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: exp.status === "paid" ? "var(--success)" : "var(--warning)"
                            }}
                          >
                            {exp.status === "paid" ? "PAGADO" : "PENDIENTE"}
                          </button>
                       </td>
                       <td style={{ padding: "1rem", textAlign: "right" }}>
                         <button onClick={() => handleDelete(exp.id, exp.description)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--warning)" }}>🗑️</button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
