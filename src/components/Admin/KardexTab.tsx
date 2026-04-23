"use client";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface InventoryLog {
  id: string;
  date: string;
  ingredient_id: string;
  ingredient_name?: string;
  type: "in" | "out";
  quantity: number;
  user?: string;
  reason?: string;
}

interface Ingredient {
  id: string;
  name: string;
  group?: string;
}

interface Props {
  logs: InventoryLog[];
  ingredients: Ingredient[];
}

// ── Group Color Dots ──────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, string> = {
  "Carne":            "#E8593C",
  "Empaque":          "#7A5C1E",
  "Acompañantes":     "#27500A",
  "Costo Operativo":  "#185FA5",
  "Varios":           "#A09890",
};

function getGroupColor(group?: string): string {
  return GROUP_COLORS[group || ""] || "#A09890";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatKardexDate(isoString: string): string {
  const fecha = new Date(isoString);
  const dia = fecha.getDate();
  const mes = fecha.toLocaleString("es", { month: "short" });
  const hora = fecha.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dia} ${mes} · ${hora}`;
}

function TipoChip({ tipo }: { tipo: "ENTRADA" | "SALIDA" }) {
  const esEntrada = tipo === "ENTRADA";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.05em",
        backgroundColor: esEntrada ? "rgba(39, 80, 10, 0.1)" : "rgba(232, 89, 60, 0.1)",
        color: esEntrada ? "#27500A" : "#E8593C",
      }}
    >
      {esEntrada ? "↑" : "↓"} {tipo}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function KardexTab({ logs, ingredients }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "ENTRADA" | "SALIDA">("TODOS");
  const [periodo, setPeriodo] = useState<"HOY" | "SEMANA" | "MES" | "TODO">("TODO");
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 20;
  const UMBRAL_ALERTA = 50;

  // ── Stock acumulado por insumo (window function client-side) ───────────────
  const logsOrdenados = useMemo(
    () => [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [logs]
  );

  const stockAcumulado = useMemo(() => {
    const acc: Record<string, number> = {};
    return logsOrdenados.map((log) => {
      const delta = log.type === "in" ? log.quantity : -log.quantity;
      acc[log.ingredient_id] = (acc[log.ingredient_id] || 0) + delta;
      return { ...log, stock_resultante: acc[log.ingredient_id] };
    });
  }, [logsOrdenados]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return [...stockAcumulado]
      .reverse() // más reciente primero
      .filter((log) => {
        const nombre =
          log.ingredient_name ??
          ingredients.find((i) => i.id === log.ingredient_id)?.name ??
          "";
        if (busqueda && !nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;

        if (tipoFiltro === "ENTRADA" && log.type !== "in") return false;
        if (tipoFiltro === "SALIDA" && log.type !== "out") return false;

        const fecha = new Date(log.date);
        if (periodo === "HOY") {
          if (fecha.toDateString() !== now.toDateString()) return false;
        } else if (periodo === "SEMANA") {
          const semanaAtras = new Date(now);
          semanaAtras.setDate(now.getDate() - 7);
          if (fecha < semanaAtras) return false;
        } else if (periodo === "MES") {
          const mesAtras = new Date(now);
          mesAtras.setMonth(now.getMonth() - 1);
          if (fecha < mesAtras) return false;
        }

        return true;
      });
  }, [stockAcumulado, busqueda, tipoFiltro, periodo, ingredients]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));
  const paginados = filtered.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s" }}>
      {/* ── Barra de Filtros ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Buscador */}
          <input
            type="text"
            className="input-field-admin"
            placeholder="🔍 Buscar insumo..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            style={{ flex: 2, minWidth: "180px" }}
          />

          {/* Tipo */}
          <select
            className="input-field-admin"
            value={tipoFiltro}
            onChange={(e) => { setTipoFiltro(e.target.value as any); setPagina(1); }}
            style={{ flex: 1, minWidth: "140px" }}
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ENTRADA">Solo Entradas</option>
            <option value="SALIDA">Solo Salidas</option>
          </select>

          {/* Período */}
          <select
            className="input-field-admin"
            value={periodo}
            onChange={(e) => { setPeriodo(e.target.value as any); setPagina(1); }}
            style={{ flex: 1, minWidth: "140px" }}
          >
            <option value="TODO">Todo el tiempo</option>
            <option value="HOY">Hoy</option>
            <option value="SEMANA">Esta semana</option>
            <option value="MES">Este mes</option>
          </select>

          {/* Contador */}
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap", marginLeft: "auto" }}>
            Mostrando{" "}
            <strong style={{ color: "var(--color-text-heading)" }}>
              {Math.min((pagina - 1) * POR_PAGINA + 1, filtered.length)}–{Math.min(pagina * POR_PAGINA, filtered.length)}
            </strong>{" "}
            de{" "}
            <strong style={{ color: "var(--color-text-heading)" }}>{filtered.length}</strong>{" "}
            movimientos
          </span>
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="admin-table" style={{ minWidth: "700px" }}>
            <thead>
              <tr>
                <th className="sticky-col" style={{ minWidth: "180px" }}>Insumo</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cant.</th>
                <th>Stock</th>
                <th className="kardex-hide-mobile">Responsable</th>
                <th className="kardex-hide-mobile">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
                    Sin movimientos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginados.map((log) => {
                  const isOut = log.type === "out";
                  const ingredient = ingredients.find((i) => i.id === log.ingredient_id);
                  const nombre =
                    log.ingredient_name ??
                    ingredient?.name ??
                    "—";
                  const grupo = ingredient?.group;
                  const dotColor = getGroupColor(grupo);
                  const esAnomalía = Math.abs(log.quantity) > UMBRAL_ALERTA;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor: esAnomalía ? "#FFFBEB" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Columna Insumo — sticky, sin imagen, solo texto */}
                      <td className="sticky-col" style={{ backgroundColor: esAnomalía ? "#FFFBEB" : "var(--color-bg-card, white)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: dotColor,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--color-text-brand)", fontSize: "14px" }}>
                              {nombre}
                            </div>
                            {grupo && (
                              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
                                {grupo}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td style={{ fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {formatKardexDate(log.date)}
                      </td>

                      {/* Tipo */}
                      <td>
                        <TipoChip tipo={isOut ? "SALIDA" : "ENTRADA"} />
                      </td>

                      {/* Cantidad con alerta */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {esAnomalía && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#B45309",
                                backgroundColor: "#FDE68A",
                                padding: "1px 6px",
                                borderRadius: "100px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ⚠ Revisar
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight: 800,
                              color: isOut ? "#E8593C" : "#27500A",
                              fontSize: "14px",
                            }}
                          >
                            {isOut ? "-" : "+"}{log.quantity}
                          </span>
                        </div>
                      </td>

                      {/* Stock Resultante */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color:
                              log.stock_resultante < 0
                                ? "#E8593C"
                                : log.stock_resultante < 5
                                ? "#B45309"
                                : "var(--color-text-primary)",
                          }}
                        >
                          {log.stock_resultante}
                        </span>
                      </td>

                      {/* Responsable */}
                      <td className="kardex-hide-mobile" style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                        {log.user ?? "Sistema"}
                      </td>

                      {/* Motivo */}
                      <td className="kardex-hide-mobile" style={{ fontSize: "12px", color: "var(--color-text-secondary)", maxWidth: "160px" }}>
                        <span title={log.reason ?? ""}>
                          {(log.reason ?? "—").length > 24
                            ? (log.reason ?? "").slice(0, 24) + "…"
                            : (log.reason ?? "—")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Paginación ────────────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button
            className="action-btn-admin"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{ opacity: pagina === 1 ? 0.4 : 1 }}
          >
            ←
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "…" ? (
                <span key={`ellipsis-${idx}`} style={{ color: "var(--color-text-secondary)", padding: "0 4px" }}>…</span>
              ) : (
                <button
                  key={item}
                  className="action-btn-admin"
                  onClick={() => setPagina(item as number)}
                  style={{
                    backgroundColor: pagina === item ? "var(--color-accent-brasa)" : undefined,
                    color: pagina === item ? "white" : undefined,
                    borderColor: pagina === item ? "var(--color-accent-brasa)" : undefined,
                    fontWeight: pagina === item ? 800 : undefined,
                  }}
                >
                  {item}
                </button>
              )
            )}

          <button
            className="action-btn-admin"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{ opacity: pagina === totalPaginas ? 0.4 : 1 }}
          >
            →
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .kardex-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
