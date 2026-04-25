"use client";
import React from "react";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
import Sidebar from "@/components/Admin/Sidebar";
import { Expense } from "@/lib/mockDB";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtL(n: number) {
  const val = typeof n === "number" ? n : 0;
  return `L ${val.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
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

  const expenses = state?.expenses || [];

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => filterStatus === "all" || e.status === filterStatus)
      .filter(e => filterCat === "all" || e.category === filterCat)
      .filter(e => {
        const desc = (e.description || "").toLowerCase();
        const prov = (e.provider || "").toLowerCase();
        const q = busqueda.toLowerCase();
        return desc.includes(q) || prov.includes(q);
      })
      .filter(e => {
        if (!e.date) return periodo === "Todo";
        const d = new Date(e.date);
        if (periodo === "Hoy") return d.toDateString() === now.toDateString();
        if (periodo === "Esta semana") { 
          const w = new Date(now); 
          w.setDate(now.getDate() - 7); 
          return d >= w; 
        }
        if (periodo === "Este mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
  }, [expenses, filterStatus, filterCat, busqueda, periodo]);

  // ── Métricas ──────────────────────────────────────────────────────────────
  // Comparativa con período anterior (mismo rango)
  const previousPeriodTotal = useMemo(() => {
    const now = new Date();
    let from: Date, to: Date;
    if (periodo === "Hoy") {
      from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0,0,0,0);
      to = new Date(from); to.setHours(23,59,59,999);
    } else if (periodo === "Esta semana") {
      to = new Date(now); to.setDate(to.getDate() - 7);
      from = new Date(to); from.setDate(from.getDate() - 7);
    } else if (periodo === "Este mes") {
      to = new Date(now.getFullYear(), now.getMonth(), 0);
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      return 0;
    }
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= from && d <= to;
      })
      .reduce((a, e) => a + (e.amount || 0), 0);
  }, [expenses, periodo]);

  if (!hydrated) return null;

  const periodTotal = filteredExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const change = previousPeriodTotal > 0 
    ? ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100 
    : null;
  const totalCount = filteredExpenses.length;
  const pendienteCntFiltered = filteredExpenses.filter(e => e.status === "pending").length;
  const pagadoFiltered = filteredExpenses.filter(e => e.status === "paid")
    .reduce((a, e) => a + (e.amount || 0), 0);
  const pendienteFiltered = filteredExpenses.filter(e => e.status === "pending")
    .reduce((a, e) => a + (e.amount || 0), 0);
  const pagoPorcFiltered = periodTotal > 0 ? (pagadoFiltered / periodTotal) * 100 : 0;

  // ── Resumen por categoría ─────────────────────────────────────────────────
  const categorySummary = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      const cat = e.category || "Otros";
      acc[cat] = (acc[cat] || 0) + (e.amount || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = categorySummary.length > 0 ? categorySummary[0][1] : 1;

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

  const LBL = { color: "#5C5550", fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em" };

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
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Registra tus gastos, controla pagos pendientes y mantén tu flujo de caja sano.</p>
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
            <div style={{ 
              display: "flex", 
              gap: "6px", 
              flexWrap: "wrap", 
              alignItems: "center", 
              marginBottom: "1.5rem",
              padding: "6px",
              background: "var(--bg-secondary, #F5F1ED)",
              borderRadius: "100px",
              width: "fit-content",
              border: "1px solid var(--border-color, #EBEBEB)"
            }}>
              {["Hoy", "Esta semana", "Este mes", "Todo"].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriodo(p)} 
                  style={{
                    padding: "6px 14px", 
                    borderRadius: "100px", 
                    fontSize: "12px", 
                    cursor: "pointer",
                    border: "none",
                    fontWeight: periodo === p ? 700 : 600,
                    background: periodo === p ? "#E8593C" : "transparent",
                    color: periodo === p ? "white" : "#5C5550",
                    transition: "all 150ms"
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Métricas */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
              gap: "1rem", 
              marginBottom: "1.5rem" 
            }}>
              
              {/* Card 1: Gasto total con comparativa */}
              <div className="admin-card" style={{ 
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minHeight: "140px"
              }}>
                <div style={{ 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  color: "#5C5550", 
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Gasto Total
                </div>
                <div style={{ 
                  fontSize: "26px", 
                  fontWeight: 800, 
                  color: "#1A1714", 
                  fontVariantNumeric: "tabular-nums" 
                }}>
                  {fmtL(periodTotal)}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#5C5550",
                  marginTop: "auto"
                }}>
                  {totalCount} {totalCount === 1 ? "factura" : "facturas"}
                </div>
                {change !== null && periodo !== "Todo" && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: change > 5 ? "#791F1F" : change < -5 ? "#27500A" : "#5C5550"
                  }}>
                    {change > 0 ? "↑" : change < 0 ? "↓" : "→"} 
                    {Math.abs(change).toFixed(1)}% vs período anterior
                  </div>
                )}
              </div>

              {/* Card 2: Pagado */}
              <div className="admin-card" style={{ 
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minHeight: "140px",
                borderLeft: "3px solid #27500A"
              }}>
                <div style={{ 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  color: "#5C5550", 
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  ✓ Pagado
                </div>
                <div style={{ 
                  fontSize: "26px", 
                  fontWeight: 800, 
                  color: "#27500A", 
                  fontVariantNumeric: "tabular-nums" 
                }}>
                  {fmtL(pagadoFiltered)}
                </div>
                <div style={{ 
                  background: "#EBEBEB", 
                  borderRadius: "4px", 
                  height: "5px", 
                  overflow: "hidden",
                  marginTop: "auto"
                }}>
                  <div style={{ 
                    width: `${pagoPorcFiltered}%`, 
                    height: "100%", 
                    background: "#27500A", 
                    borderRadius: "4px", 
                    transition: "width 0.5s" 
                  }} />
                </div>
                <div style={{ fontSize: "12px", color: "#5C5550" }}>
                  {pagoPorcFiltered.toFixed(0)}% del total
                </div>
              </div>

              {/* Card 3: Pendiente */}
              <div className="admin-card" style={{ 
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minHeight: "140px",
                borderLeft: pendienteFiltered > 0 ? "3px solid #E8593C" : "3px solid transparent"
              }}>
                <div style={{ 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  color: "#5C5550", 
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  ⏳ Pendiente de pago
                </div>
                <div style={{ 
                  fontSize: "26px", 
                  fontWeight: 800, 
                  color: pendienteFiltered > 0 ? "#791F1F" : "#27500A", 
                  fontVariantNumeric: "tabular-nums" 
                }}>
                  {fmtL(pendienteFiltered)}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#5C5550",
                  marginTop: "auto"
                }}>
                  {pendienteCntFiltered === 0 
                    ? "Sin facturas pendientes" 
                    : `${pendienteCntFiltered} ${pendienteCntFiltered === 1 ? "factura" : "facturas"}`}
                </div>
                {pendienteCntFiltered > 0 && (
                  <div style={{ 
                    fontSize: "11px", 
                    background: "#FEF3C7", 
                    color: "#92400E", 
                    padding: "3px 10px", 
                    borderRadius: "100px", 
                    display: "inline-block",
                    fontWeight: 700,
                    alignSelf: "flex-start"
                  }}>
                    Atender pronto
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
                <div style={{ 
                  textAlign: "center", 
                  padding: "3rem 1rem",
                  color: "var(--color-text-secondary, #5C5550)"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.6 }}>
                    🧾
                  </div>
                  <p style={{ 
                    fontSize: "1rem", 
                    fontWeight: 700, 
                    margin: "0 0 0.4rem",
                    color: "var(--color-text-heading, #1A1714)"
                  }}>
                    {filtrosActivos ? "Sin resultados para estos filtros" : "Aún no hay gastos registrados"}
                  </p>
                  <p style={{ fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
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

      {/* ── Drawer Lateral: SaaS Minimalist Redesign ──────────────────────────── */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }} />
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "min(600px, 100vw)",
            background: "#FFFFFF", overflowY: "auto",
            boxShadow: "-10px 0 50px rgba(0,0,0,0.1)",
            animation: "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "2rem 2rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ color: "#1A1714", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Nuevo Gasto</h2>
                <p style={{ color: "#5C5550", fontSize: "14px", marginTop: "4px" }}>Registra los detalles de la transacción</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ 
                background: "#F5F2EE", border: "none", width: "32px", height: "32px", 
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", 
                cursor: "pointer", color: "#5C5550" 
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "0 2rem 2rem", display: "flex", flexDirection: "column", gap: "2rem", flex: 1 }}>
              
              {/* Sección 1: Datos del Gasto */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={LBL}>CONCEPTO *</label>
                  <input type="text" className="saas-input" placeholder="Ej. Reposición de inventario cárnico"
                    value={description} onChange={e => setDescription(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, description: true }))} required />
                </div>
                <div>
                  <label style={LBL}>MONTO (L) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5C5550", fontWeight: 600 }}>L</span>
                    <input type="number" className="saas-input" style={{ paddingLeft: "28px" }} placeholder="0.00" step="0.01" min="0.01"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, monto: true }))} required />
                  </div>
                </div>
                <div>
                  <label style={LBL}>FECHA *</label>
                  <input type="date" className="saas-input" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
              </div>

              {/* Sección 2: Clasificación */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={LBL}>CATEGORÍA *</label>
                  <select className="saas-input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Insumos">Insumos (Materia Prima)</option>
                    <option value="Operativo">Gasto Operativo</option>
                    <option value="Servicios">Servicios Públicos</option>
                    <option value="Personal">Personal / Nómina</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>ESTADO INICIAL</label>
                  <div style={{ 
                    display: "flex", background: "#F5F2EE", padding: "4px", borderRadius: "8px", marginTop: "6px" 
                  }}>
                    {(["pending", "paid"] as const).map(s => (
                      <button key={s} type="button" onClick={() => setStatus(s)} style={{
                        flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s",
                        background: status === s ? "#FFFFFF" : "transparent",
                        color: status === s ? "#1A1714" : "#5C5550",
                        boxShadow: status === s ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                      }}>
                        {s === "pending" ? "Pendiente" : "Pagado"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección 3: Soporte */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={LBL}>PROVEEDOR (OPCIONAL)</label>
                  <input type="text" className="saas-input" placeholder="Nombre del comercio"
                    value={provider} onChange={e => setProvider(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>N° FACTURA (OPCIONAL)</label>
                  <input type="text" className="saas-input" placeholder="Ej. 000-001-01"
                    value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={LBL}>COMPROBANTE</label>
                  <div style={{
                    marginTop: "6px", border: "2px dashed #EBEBEB", borderRadius: "12px", padding: "2rem",
                    textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
                  }} onMouseOver={e => e.currentTarget.style.borderColor = "#7A5C1E"} onMouseOut={e => e.currentTarget.style.borderColor = "#EBEBEB"}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
                    <div style={{ fontSize: "13px", color: "#1A1714", fontWeight: 600 }}>Haz clic para subir o arrastra un archivo</div>
                    <div style={{ fontSize: "11px", color: "#5C5550", marginTop: "4px" }}>Soporta JPG, PNG o PDF (Máx. 5MB)</div>
                    <input type="file" hidden accept="image/*,.pdf" />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <button type="submit" disabled={!isValid} style={{
                marginTop: "1rem", padding: "16px", width: "100%",
                background: isValid ? "#27500A" : "#D8D4CF", // Esmeralda si es válido
                color: "white", border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: 800, cursor: isValid ? "pointer" : "not-allowed",
                transition: "all 0.3s",
                boxShadow: isValid ? "0 4px 15px rgba(39, 80, 10, 0.2)" : "none",
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
        .saas-input {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border: 1px solid #EBEBEB;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          color: #1A1714;
        }
        .saas-input:focus {
          outline: none;
          border-color: #27500A;
          box-shadow: 0 0 0 3px rgba(39, 80, 10, 0.05);
        }
        @media (max-width: 640px) {
          .expenses-hide-mobile { display: none !important; }
        }
      `}</style>
    </AuthGuard>
  );
}
