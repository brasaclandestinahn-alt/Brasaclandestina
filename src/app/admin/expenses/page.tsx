"use client";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";
import { Expense } from "@/lib/mockDB";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtL(n: number) {
  return `L ${n.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("es", { month: "short" })} · ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Insumos: "#E8593C",
  Operativo: "#7A5C1E",
  Servicios: "#185FA5",
  Personal: "#27500A",
  Otros: "#A09890",
};

function EstadoChip({ estado, onClick }: { estado: string; onClick?: () => void }) {
  const ok = estado === "paid";
  return (
    <button onClick={onClick} style={{
      padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700,
      backgroundColor: ok ? "#EAF3DE" : "#FEF3C7",
      color: ok ? "#27500A" : "#92400E",
      border: "none", cursor: onClick ? "pointer" : "default",
    }}>
      {ok ? "✓ Pagado" : "⏳ Pendiente"}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { state, hydrated, addExpense, editExpense, removeExpense } = useAppState();

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Insumos");
  const [provider, setProvider] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("pending");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Filters
  const [busqueda, setBusqueda] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");
  const [filterCat, setFilterCat] = useState("all");
  const [periodo, setPeriodo] = useState("Este mes");

  if (!hydrated) return null;

  // ── Métricas ──────────────────────────────────────────────────────────────
  const total = state.expenses.reduce((a, e) => a + e.amount, 0);
  const pagado = state.expenses.filter(e => e.status === "paid").reduce((a, e) => a + e.amount, 0);
  const pendiente = state.expenses.filter(e => e.status === "pending").reduce((a, e) => a + e.amount, 0);
  const pendienteCnt = state.expenses.filter(e => e.status === "pending").length;
  const pagoPorc = total > 0 ? (pagado / total) * 100 : 0;

  // ── Resumen por categoría ─────────────────────────────────────────────────
  const categorySummary = Object.entries(
    state.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = categorySummary[0]?.[1] || 1;

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return state.expenses
      .filter(e => filterStatus === "all" || e.status === filterStatus)
      .filter(e => filterCat === "all" || e.category === filterCat)
      .filter(e =>
        e.description.toLowerCase().includes(busqueda.toLowerCase()) ||
        (e.provider || "").toLowerCase().includes(busqueda.toLowerCase())
      )
      .filter(e => {
        const d = new Date(e.date);
        if (periodo === "Hoy") return d.toDateString() === now.toDateString();
        if (periodo === "Esta semana") { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
        if (periodo === "Este mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.expenses, filterStatus, filterCat, busqueda, periodo]);

  const filtrosActivos = busqueda || filterStatus !== "all" || filterCat !== "all";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const isValid = date !== "" && description.trim().length > 3 && Number(amount) > 0 && category !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const newExp: Expense = {
      id: "exp_" + Math.random().toString(36).substr(2, 6),
      description, amount: Number(amount),
      date: new Date(date).toISOString(),
      status, category,
      provider: provider || undefined,
    };
    addExpense(newExp);
    setDescription(""); setAmount(""); setProvider(""); setInvoiceNum("");
    setDate(new Date().toISOString().split("T")[0]);
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string, cur: string) =>
    editExpense(id, { status: cur === "paid" ? "pending" : "paid" });

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`¿Eliminar "${desc}"?`)) removeExpense(id);
  };

  const T = { color: "var(--color-text-secondary)", fontSize: "0.8rem", fontWeight: 700 };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />
        <main className="main-content-responsive">
          <div className="admin-container">

            {/* Header */}
            <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className="section-title-fluid" style={{ marginBottom: "0.25rem" }}>Gestión de Gastos y Facturas</h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Control del flujo de salida de efectivo y cuentas por pagar.</p>
              </div>
              <button onClick={() => setDrawerOpen(true)} style={{
                background: "#E8593C", color: "white", border: "none", borderRadius: "50px",
                padding: "10px 22px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
              }}>
                + Registrar Gasto
              </button>
            </header>

            {/* Selector de período */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Período:</span>
              {["Hoy", "Esta semana", "Este mes", "Todo"].map(p => (
                <button key={p} onClick={() => setPeriodo(p)} style={{
                  padding: "4px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer",
                  border: "1px solid", fontWeight: periodo === p ? 700 : 400,
                  borderColor: periodo === p ? "#E8593C" : "#EBEBEB",
                  background: periodo === p ? "#E8593C" : "white",
                  color: periodo === p ? "white" : "#5C5550",
                }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Métricas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Card 1 */}
              <div className="admin-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "11px", color: "#5C5550", marginBottom: "4px" }}>{periodo}</div>
                <div style={{ fontSize: "13px", color: "#5C5550", marginBottom: "6px" }}>Gasto total</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#1A1714", fontVariantNumeric: "tabular-nums" }}>{fmtL(total)}</div>
              </div>
              {/* Card 2 */}
              <div className="admin-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "11px", color: "#5C5550", marginBottom: "4px" }}>{periodo}</div>
                <div style={{ fontSize: "13px", color: "#5C5550", marginBottom: "6px" }}>Pagado</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#27500A", fontVariantNumeric: "tabular-nums" }}>{fmtL(pagado)}</div>
                <div style={{ background: "#EBEBEB", borderRadius: "4px", height: "5px", margin: "8px 0", overflow: "hidden" }}>
                  <div style={{ width: `${pagoPorc}%`, height: "100%", background: "#27500A", borderRadius: "4px", transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: "12px", color: "#5C5550" }}>{pagoPorc.toFixed(0)}% del total</div>
              </div>
              {/* Card 3 */}
              <div className="admin-card" style={{ padding: "18px 20px", borderLeft: pendiente > 0 ? "3px solid #E8593C" : "none" }}>
                <div style={{ fontSize: "11px", color: "#5C5550", marginBottom: "4px" }}>{periodo}</div>
                <div style={{ fontSize: "13px", color: "#5C5550", marginBottom: "6px" }}>Pendiente de pago</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: pendiente > 0 ? "#791F1F" : "#27500A", fontVariantNumeric: "tabular-nums" }}>{fmtL(pendiente)}</div>
                {pendienteCnt > 0 && (
                  <div style={{ fontSize: "12px", background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "100px", display: "inline-block", marginTop: "6px" }}>
                    {pendienteCnt} {pendienteCnt === 1 ? "factura pendiente" : "facturas pendientes"}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen por categoría */}
            {categorySummary.length > 0 && (
              <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontWeight: 700, color: "var(--color-text-heading)", marginBottom: "1rem", fontSize: "14px" }}>
                  Gastos por categoría — {periodo}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {categorySummary.map(([cat, tot]) => (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-heading)" }}>{fmtL(tot)}</span>
                      </div>
                      <div style={{ background: "#EBEBEB", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                        <div style={{ width: `${(tot / maxCat) * 100}%`, height: "100%", background: CATEGORY_COLORS[cat] || "#A09890", borderRadius: "4px", transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filtros del historial */}
            <div className="admin-card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text" className="input-field-admin" placeholder="🔍 Buscar gasto o proveedor..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  style={{ flex: 2, minWidth: "180px" }}
                />
                <select className="input-field-admin" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ flex: 1, minWidth: "150px" }}>
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                </select>
                <select className="input-field-admin" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: 1, minWidth: "150px" }}>
                  <option value="all">Todas las categorías</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Operativo">Costo Operativo</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Personal">Personal</option>
                  <option value="Otros">Otros</option>
                </select>
                {filtrosActivos && (
                  <button onClick={() => { setBusqueda(""); setFilterStatus("all"); setFilterCat("all"); }}
                    style={{ fontSize: "12px", color: "#E8593C", background: "none", border: "none", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Tabla / Estado vacío */}
            <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
              {filteredExpenses.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧾</div>
                  <h3 style={{ color: "var(--color-text-heading)", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {filtrosActivos ? "Sin resultados para estos filtros" : "Aún no hay gastos registrados"}
                  </h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.5rem" }}>
                    {filtrosActivos ? "Intenta cambiar o limpiar los filtros aplicados." : "Registra tu primer gasto para empezar a llevar el control."}
                  </p>
                  {filtrosActivos
                    ? <button onClick={() => { setBusqueda(""); setFilterStatus("all"); setFilterCat("all"); }} style={{ padding: "8px 20px", borderRadius: "50px", border: "1px solid #E8593C", color: "#E8593C", background: "white", cursor: "pointer", fontWeight: 700 }}>Limpiar filtros</button>
                    : <button onClick={() => setDrawerOpen(true)} style={{ padding: "8px 20px", borderRadius: "50px", background: "#E8593C", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>+ Registrar primer gasto</button>
                  }
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table" style={{ minWidth: "640px" }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th className="expenses-hide-mobile">Categoría</th>
                        <th style={{ textAlign: "right" }}>Monto</th>
                        <th style={{ textAlign: "center" }}>Estado</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map(exp => (
                        <tr key={exp.id}>
                          <td style={{ fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                            {fmtDate(exp.date)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--color-text-brand)", fontSize: "14px" }}>{exp.description}</div>
                            {exp.provider && <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{exp.provider}</div>}
                          </td>
                          <td className="expenses-hide-mobile">
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: "100px",
                              fontSize: "11px", fontWeight: 700,
                              backgroundColor: `${CATEGORY_COLORS[exp.category] || "#A09890"}18`,
                              color: CATEGORY_COLORS[exp.category] || "#A09890",
                            }}>{exp.category}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "var(--color-text-heading)", fontSize: "15px" }}>
                            {fmtL(exp.amount)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <EstadoChip estado={exp.status} onClick={() => toggleStatus(exp.id, exp.status)} />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              {exp.status === "pending" && (
                                <button onClick={() => editExpense(exp.id, { status: "paid" })} style={{
                                  padding: "4px 10px", background: "#EAF3DE", color: "#27500A",
                                  border: "none", borderRadius: "20px", fontSize: "11px", fontWeight: 600, cursor: "pointer"
                                }}>✓ Pagar</button>
                              )}
                              <button onClick={() => handleDelete(exp.id, exp.description)} className="action-btn-admin">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ── Drawer Lateral ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          {/* Overlay */}
          <div onClick={() => setDrawerOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(26,23,20,0.5)", backdropFilter: "blur(4px)" }} />
          {/* Panel */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "min(460px, 100vw)",
            background: "var(--color-bg-card, white)", overflowY: "auto",
            boxShadow: "-20px 0 60px rgba(0,0,0,0.2)",
            animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Drawer Header */}
            <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid var(--color-border-light, #EBEBEB)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ color: "var(--color-text-heading)", fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Registrar Gasto</h2>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "4px 0 0" }}>Completa los campos obligatorios (*)</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#5C5550" }}>✕</button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>

              {/* 1. Fecha */}
              <div>
                <label style={T}>FECHA DEL GASTO *</label>
                <input type="date" className="input-field-admin" style={{ width: "100%", marginTop: "6px" }}
                  value={date} onChange={e => setDate(e.target.value)} required />
              </div>

              {/* 2. Descripción */}
              <div>
                <label style={T}>DESCRIPCIÓN / CONCEPTO *</label>
                <input type="text" className="input-field-admin" style={{ width: "100%", marginTop: "6px" }}
                  placeholder="Ej. Compra 50lbs Harina"
                  value={description} onChange={e => setDescription(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, description: true }))} required />
                {touched.description && description.trim().length <= 3 && (
                  <p style={{ fontSize: "11px", color: "#E8593C", marginTop: "4px" }}>Mínimo 4 caracteres</p>
                )}
              </div>

              {/* 3. Categoría */}
              <div>
                <label style={T}>CATEGORÍA *</label>
                <select className="input-field-admin" style={{ width: "100%", marginTop: "6px" }} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Insumos">Insumos (Materia Prima)</option>
                  <option value="Operativo">Gasto Operativo</option>
                  <option value="Servicios">Servicios Públicos</option>
                  <option value="Personal">Personal / Nómina</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {/* 4. Monto */}
              <div>
                <label style={T}>MONTO (L) *</label>
                <input type="number" className="input-field-admin" style={{ width: "100%", marginTop: "6px" }}
                  placeholder="0.00" step="0.01" min="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, monto: true }))} required />
                {touched.monto && Number(amount) <= 0 && (
                  <p style={{ fontSize: "11px", color: "#E8593C", marginTop: "4px" }}>El monto debe ser mayor a 0</p>
                )}
              </div>

              {/* 5. Proveedor */}
              <div>
                <label style={T}>PROVEEDOR (OPCIONAL)</label>
                <input type="text" className="input-field-admin" style={{ width: "100%", marginTop: "6px" }}
                  placeholder="Nombre empresa o persona"
                  value={provider} onChange={e => setProvider(e.target.value)} />
              </div>

              {/* 6. N° Factura */}
              <div>
                <label style={T}>N° DE FACTURA (OPCIONAL)</label>
                <input type="text" className="input-field-admin" style={{ width: "100%", marginTop: "6px" }}
                  placeholder="Ej. FAC-00123"
                  value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} />
              </div>

              {/* 7. Comprobante */}
              <div>
                <label style={T}>COMPROBANTE (OPCIONAL)</label>
                <input type="file" accept="image/*,.pdf" style={{ marginTop: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }} />
              </div>

              {/* 8. Estado */}
              <div>
                <label style={T}>ESTADO INICIAL</label>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  {(["pending", "paid"] as const).map(s => (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "var(--color-text-primary)" }}>
                      <input type="radio" checked={status === s} onChange={() => setStatus(s)} />
                      {s === "pending" ? "⏳ Pendiente" : "✓ Pagado"}
                    </label>
                  ))}
                </div>
              </div>

              {/* 9. Submit */}
              <button type="submit" disabled={!isValid} style={{
                marginTop: "auto", padding: "14px", width: "100%",
                background: isValid ? "#E8593C" : "#D8D4CF",
                color: "white", border: "none", borderRadius: "50px",
                fontSize: "15px", fontWeight: 800, cursor: isValid ? "pointer" : "not-allowed",
                transition: "background 0.2s",
              }}>
                GUARDAR GASTO
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .expenses-hide-mobile { display: none !important; }
        }
      `}</style>
    </AuthGuard>
  );
}
