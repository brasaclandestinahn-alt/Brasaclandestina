"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/useStore";
import type { Product } from "@/lib/mockDB";
import {
  calculateProductAvailability,
  ProductAvailabilityResult,
} from "@/lib/inventoryAvailability";
import { formatCurrency } from "@/lib/utils";

interface RecipeDetailRow {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  requiredQty: number;
  currentStock: number;
  possiblePortions: number;
  isMissing: boolean;
  isLimiting: boolean;
}

export default function ProductAvailabilityPanel() {
  const { state, hydrated, loading } = useAppState();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  // Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalProduct(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Cálculo reactivo de disponibilidad para todo el catálogo ──────────────
  const evaluatedProducts = useMemo(() => {
    return state.products.map((product) => {
      const result: ProductAvailabilityResult = calculateProductAvailability(
        product,
        state.ingredients
      );
      return {
        product,
        result,
      };
    });
  }, [state.products, state.ingredients]);

  // ── Métricas resumen de disponibilidad ────────────────────────────────────
  const summary = useMemo(() => {
    let disponibles = 0;
    let pocasUnidades = 0;
    let agotados = 0;
    let sinReceta = 0;
    let sinSeguimiento = 0;

    evaluatedProducts.forEach(({ result }) => {
      switch (result.status) {
        case "Disponible":
          disponibles++;
          break;
        case "Pocas unidades":
          pocasUnidades++;
          break;
        case "Agotado":
          agotados++;
          break;
        case "Sin receta / Configuración incompleta":
          sinReceta++;
          break;
        case "Sin seguimiento":
          sinSeguimiento++;
          break;
      }
    });

    return {
      disponibles,
      pocasUnidades,
      agotados,
      sinReceta,
      sinSeguimiento,
      total: evaluatedProducts.length,
    };
  }, [evaluatedProducts]);

  // ── Platos críticos para el panel de alertas ──────────────────────────────
  const criticalItems = useMemo(() => {
    return evaluatedProducts
      .filter(
        ({ product, result }) =>
          product.is_active &&
          (result.status === "Agotado" ||
            result.status === "Pocas unidades" ||
            result.status === "Sin receta / Configuración incompleta")
      )
      .slice(0, 6);
  }, [evaluatedProducts]);

  // ── Filtrado por búsqueda, categoría y estado ─────────────────────────────
  const filteredProducts = useMemo(() => {
    return evaluatedProducts.filter(({ product, result }) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        result.limitingIngredients.some((ing) =>
          ing.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "all" || result.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [evaluatedProducts, searchTerm, selectedCategory, selectedStatus]);

  // ── Helper para el Modal de Detalle de Receta ─────────────────────────────
  const modalRecipeDetails = useMemo((): RecipeDetailRow[] => {
    if (!activeModalProduct) return [];

    // Caso directo (bebida)
    if (
      activeModalProduct.inventory_tracking === "direct" ||
      activeModalProduct.direct_ingredient_id
    ) {
      const ing = state.ingredients.find(
        (i) => i.id === activeModalProduct.direct_ingredient_id
      );
      if (!ing) {
        return [
          {
            ingredientId: activeModalProduct.direct_ingredient_id || "direct_missing",
            ingredientName: "Insumo directo no encontrado",
            unit: "u",
            requiredQty: 1,
            currentStock: 0,
            possiblePortions: 0,
            isMissing: true,
            isLimiting: true,
          },
        ];
      }
      const rawStock = Math.max(0, Number(ing.stock) || 0);
      const portions = Math.floor(rawStock);
      return [
        {
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          requiredQty: 1,
          currentStock: rawStock,
          possiblePortions: portions,
          isMissing: false,
          isLimiting: portions <= 5,
        },
      ];
    }

    // Caso receta compuesta
    if (!activeModalProduct.recipe || activeModalProduct.recipe.length === 0) {
      return [];
    }

    // Consolidar cantidades duplicadas
    const consolidated = new Map<string, number>();
    activeModalProduct.recipe.forEach((r) => {
      const prev = consolidated.get(r.ingredient_id) || 0;
      consolidated.set(r.ingredient_id, prev + (Number(r.quantity) || 0));
    });

    const availability = calculateProductAvailability(
      activeModalProduct,
      state.ingredients
    );

    const rows: RecipeDetailRow[] = [];
    consolidated.forEach((reqQty, ingId) => {
      const ing = state.ingredients.find((i) => i.id === ingId);
      if (!ing) {
        rows.push({
          ingredientId: ingId,
          ingredientName: `Insumo #${ingId} (Eliminado o no encontrado)`,
          unit: "u",
          requiredQty: reqQty,
          currentStock: 0,
          possiblePortions: 0,
          isMissing: true,
          isLimiting: true,
        });
        return;
      }

      const rawStock = Math.max(0, Number(ing.stock) || 0);
      const portions = reqQty > 0 ? Math.floor(rawStock / reqQty) : 0;
      const isLimiting =
        availability.limitingIngredients.includes(ing.name) ||
        portions === availability.availablePortions;

      rows.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.unit,
        requiredQty: reqQty,
        currentStock: rawStock,
        possiblePortions: portions,
        isMissing: false,
        isLimiting,
      });
    });

    return rows;
  }, [activeModalProduct, state.ingredients]);

  // Fallback si no está hidratado
  if (!hydrated) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: "2rem",
          textAlign: "center",
          marginBottom: "2rem",
          background: "#ffffff",
        }}
      >
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
          ⏳ Cargando disponibilidad de platillos...
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Disponibilidad de Platos"
      style={{ marginBottom: "2rem" }}
    >
      {/* ── ENCABEZADO DE SECCIÓN ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                fontFamily: "inherit",
              }}
            >
              🥘 Disponibilidad de Platos
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "100px",
                background: loading ? "rgba(234, 179, 8, 0.15)" : "rgba(34, 197, 94, 0.12)",
                color: loading ? "#b45309" : "#15803d",
                border: `1px solid ${loading ? "rgba(234, 179, 8, 0.3)" : "rgba(34, 197, 94, 0.25)"}`,
              }}
            >
              {loading ? "● Sincronizando..." : "● Tiempo Real"}
            </span>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "0.25rem",
              marginBottom: 0,
            }}
          >
            Platos que puedes preparar con tu inventario actual en cocina
          </p>
        </div>

        <Link
          href="/admin/pricing"
          style={{
            fontSize: "0.8rem",
            color: "var(--accent-color)",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255, 107, 0, 0.2)",
            transition: "all 150ms",
          }}
        >
          ⚙️ Gestionar Recetas e Insumos →
        </Link>
      </div>

      {/* Nota de advertencia técnica sobre capacidades independientes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.65rem 1rem",
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.25rem",
          fontSize: "0.78rem",
          color: "#92400e",
        }}
      >
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
        <span>
          <strong>Nota de inventario:</strong> Las cantidades disponibles representan el máximo
          individual de cada plato. No deben sumarse como capacidad total acumulada, ya que varios
          platos pueden compartir ingredientes clave (ej. pan o carne).
        </span>
      </div>

      {/* ── PANEL DE RESUMEN (KPIS DE DISPONIBILIDAD) ───────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        {/* Disponibles */}
        <div
          className="glass-panel"
          style={{
            padding: "1.1rem 1.25rem",
            background: "#ffffff",
            borderLeft: "4px solid #22c55e",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Disponibles
            </span>
            <span style={{ fontSize: "1.1rem" }}>🟢</span>
          </div>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#15803d",
              margin: "0.35rem 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {summary.disponibles}
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Platos con stock &gt; 5 porciones
          </p>
        </div>

        {/* Pocas unidades */}
        <div
          className="glass-panel"
          style={{
            padding: "1.1rem 1.25rem",
            background: "#ffffff",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Pocas Unidades
            </span>
            <span style={{ fontSize: "1.1rem" }}>🟡</span>
          </div>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#b45309",
              margin: "0.35rem 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {summary.pocasUnidades}
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Stock crítico (1 a 5 porciones)
          </p>
        </div>

        {/* Agotados */}
        <div
          className="glass-panel"
          style={{
            padding: "1.1rem 1.25rem",
            background: "#ffffff",
            borderLeft: "4px solid #ef4444",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Agotados
            </span>
            <span style={{ fontSize: "1.1rem" }}>🔴</span>
          </div>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#b91c1c",
              margin: "0.35rem 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {summary.agotados}
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Sin insumos para preparar
          </p>
        </div>

        {/* Sin receta / Configuración incompleta */}
        <div
          className="glass-panel"
          style={{
            padding: "1.1rem 1.25rem",
            background: "#ffffff",
            borderLeft: "4px solid #64748b",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Sin Receta / Incompleto
            </span>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
          </div>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#475569",
              margin: "0.35rem 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {summary.sinReceta}
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Requieren costeo en Catálogo
          </p>
        </div>
      </div>

      {/* ── PANEL DE ALERTAS DE PLATOS CRÍTICOS ────────────────────────────── */}
      {criticalItems.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#9a3412" }}>
              Alertas de Producción Inmediata (Stock Crítico o Agotado)
            </h4>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.65rem",
            }}
          >
            {criticalItems.map(({ product, result }) => {
              const isAgotado = result.status === "Agotado";
              const isIncompleto = result.status === "Sin receta / Configuración incompleta";
              return (
                <div
                  key={"crit_" + product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    background: isAgotado ? "#fef2f2" : isIncompleto ? "#f8fafc" : "#fffbeb",
                    border: `1px solid ${isAgotado ? "#fecaca" : isIncompleto ? "#e2e8f0" : "#fde68a"}`,
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "0.72rem",
                        color: isAgotado ? "#dc2626" : isIncompleto ? "#64748b" : "#d97706",
                        fontWeight: 600,
                      }}
                    >
                      {isAgotado
                        ? `Agotado (${result.limitingIngredients.join(", ") || "Insumo en 0"})`
                        : isIncompleto
                        ? "Receta sin configurar"
                        : `Quedan ${result.availablePortions} porciones`}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModalProduct(product)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--accent-color)",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  >
                    Detalle
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ───────────────────────────────────── */}
      <div
        className="glass-panel"
        style={{
          padding: "1rem 1.25rem",
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Buscador */}
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            className="input-field-admin"
            placeholder="🔍 Buscar plato o insumo limitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: "10px", fontSize: "0.85rem" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Categoría */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="input-field-admin"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ fontSize: "0.82rem", minWidth: "150px" }}
          >
            <option value="all">📂 Todas las categorías</option>
            {state.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            className="input-field-admin"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ fontSize: "0.82rem", minWidth: "160px" }}
          >
            <option value="all">🎯 Todos los estados</option>
            <option value="Disponible">🟢 Disponible (&gt; 5)</option>
            <option value="Pocas unidades">🟡 Pocas unidades (1-5)</option>
            <option value="Agotado">🔴 Agotado (0)</option>
            <option value="Sin receta / Configuración incompleta">⚠️ Sin Receta</option>
            <option value="Sin seguimiento">♾️ Sin Seguimiento</option>
          </select>

          {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "4px 8px",
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── LISTADO / TABLA DE DISPONIBILIDAD ───────────────────────────────── */}
      <div
        className="glass-panel"
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      >
        {filteredProducts.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🔎</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
              No se encontraron platillos con los filtros seleccionados
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>
              Intenta cambiar los términos de búsqueda o los filtros de estado/categoría.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "0.85rem 1rem", width: "60px" }}>Plato</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Nombre & Categoría</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                    Máx. Disponible
                  </th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Estado</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Insumo Limitante / Cuello de Botella</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(({ product, result }) => {
                  const isAgotado = result.status === "Agotado";
                  const isLow = result.status === "Pocas unidades";
                  const isNone = result.status === "Sin seguimiento";
                  const isUnconfigured =
                    result.status === "Sin receta / Configuración incompleta";

                  // Estilos del badge de estado
                  let badgeBg = "#dcfce7";
                  let badgeColor = "#15803d";
                  let badgeBorder = "#bbf7d0";
                  let badgeIcon = "🟢";

                  if (isAgotado) {
                    badgeBg = "#fee2e2";
                    badgeColor = "#b91c1c";
                    badgeBorder = "#fecaca";
                    badgeIcon = "🔴";
                  } else if (isLow) {
                    badgeBg = "#fef3c7";
                    badgeColor = "#b45309";
                    badgeBorder = "#fde68a";
                    badgeIcon = "🟡";
                  } else if (isUnconfigured) {
                    badgeBg = "#f1f5f9";
                    badgeColor = "#475569";
                    badgeBorder = "#cbd5e1";
                    badgeIcon = "⚠️";
                  } else if (isNone) {
                    badgeBg = "#eff6ff";
                    badgeColor = "#1d4ed8";
                    badgeBorder = "#bfdbfe";
                    badgeIcon = "♾️";
                  }

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 120ms ease",
                        backgroundColor: isAgotado
                          ? "rgba(254, 242, 242, 0.4)"
                          : "transparent",
                      }}
                    >
                      {/* Imagen miniatura */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-burger.webp";
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "1.2rem" }}>🍔</span>
                          )}
                        </div>
                      </td>

                      {/* Nombre y categoría */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              fontSize: "0.9rem",
                            }}
                          >
                            {product.name}
                          </span>
                          {!product.is_active && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                fontWeight: 700,
                              }}
                            >
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginTop: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            {product.category}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            •
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "var(--accent-color)",
                            }}
                          >
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      </td>

                      {/* Cantidad máxima disponible */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        {isNone ? (
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#2563eb",
                              fontSize: "1rem",
                            }}
                          >
                            ♾️ Libre
                          </span>
                        ) : isUnconfigured ? (
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#64748b",
                              fontSize: "0.85rem",
                            }}
                          >
                            0
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 800,
                              color: isAgotado
                                ? "#dc2626"
                                : isLow
                                ? "#d97706"
                                : "var(--text-primary)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {result.availablePortions}
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginLeft: "4px",
                              }}
                            >
                              {result.availablePortions === 1 ? "porción" : "porciones"}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Badge de Estado */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 10px",
                            borderRadius: "100px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>{badgeIcon}</span>
                          <span>{result.status}</span>
                        </span>
                      </td>

                      {/* Insumo limitante */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {result.missingIngredients.length > 0 ? (
                          <span
                            style={{
                              color: "#dc2626",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                            }}
                          >
                            ⚠️ Faltan insumos en la base de datos
                          </span>
                        ) : isUnconfigured ? (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            Sin receta configurada
                          </span>
                        ) : isNone ? (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            No requiere insumos
                          </span>
                        ) : result.limitingIngredients.length > 0 ? (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: isAgotado ? "#b91c1c" : isLow ? "#b45309" : "var(--text-secondary)",
                              fontWeight: isAgotado || isLow ? 700 : 500,
                            }}
                          >
                            {result.limitingIngredients.join(", ")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            Sin limitaciones
                          </span>
                        )}
                      </td>

                      {/* Botón de acción */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => setActiveModalProduct(product)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "var(--text-primary)",
                            transition: "all 150ms",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent-color)";
                            e.currentTarget.style.color = "var(--accent-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          📋 Ver receta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL DE DETALLE DE RECETA ──────────────────────────────────────── */}
      {activeModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setActiveModalProduct(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "var(--radius-lg)",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid var(--border-color)",
              padding: "1.75rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.25rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {activeModalProduct.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "var(--bg-primary)",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {activeModalProduct.category}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Precio: <strong>{formatCurrency(activeModalProduct.price)}</strong> • Modo:{" "}
                  <strong>
                    {activeModalProduct.inventory_tracking === "direct"
                      ? "Insumo directo"
                      : activeModalProduct.inventory_tracking === "none"
                      ? "Sin seguimiento"
                      : "Receta compuesta"}
                  </strong>
                </p>
              </div>

              <button
                onClick={() => setActiveModalProduct(null)}
                style={{
                  background: "var(--bg-primary)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Resumen de disponibilidad del plato dentro del modal */}
            {(() => {
              const res = calculateProductAvailability(
                activeModalProduct,
                state.ingredients
              );
              const isAgotado = res.status === "Agotado";
              const isLow = res.status === "Pocas unidades";
              return (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    background: isAgotado
                      ? "#fef2f2"
                      : isLow
                      ? "#fffbeb"
                      : "#f0fdf4",
                    border: `1px solid ${
                      isAgotado ? "#fecaca" : isLow ? "#fde68a" : "#bbf7d0"
                    }`,
                    marginBottom: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      Disponibilidad actual:{" "}
                      <span
                        style={{
                          color: isAgotado
                            ? "#dc2626"
                            : isLow
                            ? "#d97706"
                            : "#15803d",
                        }}
                      >
                        {res.status === "Sin seguimiento"
                          ? "Ilimitado"
                          : `${res.availablePortions} porciones`}
                      </span>
                    </span>
                    {res.limitingIngredients.length > 0 && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Insumo más limitante: <strong>{res.limitingIngredients.join(", ")}</strong>
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "1.2rem" }}>
                    {isAgotado ? "🔴" : isLow ? "🟡" : "🟢"}
                  </span>
                </div>
              );
            })()}

            {/* Listado de Insumos / Desglose */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 0.75rem",
                }}
              >
                Insumos Requeridos y Rendimiento por Insumo
              </h4>

              {modalRecipeDetails.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px dashed var(--border-color)",
                  }}
                >
                  <p style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>🧾</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>
                    {activeModalProduct.inventory_tracking === "none"
                      ? "Este platillo no descuenta inventario (Modo Libre)"
                      : "Platillo sin receta configurada"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {activeModalProduct.inventory_tracking === "none"
                      ? "Ideal para servicios, extras libres o productos de inventario no perecedero."
                      : "Puedes asignar insumos y cantidades en el menú 'Catálogo y Precios' > 'Constructor de Recetas'."}
                  </p>
                  {activeModalProduct.inventory_tracking !== "none" && (
                    <Link
                      href="/admin/pricing"
                      className="btn-primary"
                      style={{
                        display: "inline-block",
                        marginTop: "1rem",
                        fontSize: "0.8rem",
                        padding: "6px 14px",
                        textDecoration: "none",
                      }}
                    >
                      Configurar Receta Ahora
                    </Link>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.82rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f9fafb",
                          borderBottom: "1px solid var(--border-color)",
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                        }}
                      >
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Insumo</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Requerido</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Stock Actual</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Rinde</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalRecipeDetails.map((row) => {
                        const isZero = row.possiblePortions === 0;
                        const isBottleNeck = row.isLimiting;

                        return (
                          <tr
                            key={row.ingredientId}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                              background: row.isMissing
                                ? "#fef2f2"
                                : isBottleNeck && isZero
                                ? "rgba(254, 242, 242, 0.6)"
                                : isBottleNeck
                                ? "rgba(254, 243, 199, 0.4)"
                                : "transparent",
                            }}
                          >
                            <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>
                              {row.ingredientName}
                              {row.isMissing && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#dc2626",
                                  }}
                                >
                                  Insumo no encontrado en BD
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>
                              {row.requiredQty} {row.unit}
                            </td>
                            <td
                              style={{
                                padding: "0.6rem 0.75rem",
                                textAlign: "center",
                                color: isZero ? "#dc2626" : "var(--text-primary)",
                                fontWeight: isZero ? 700 : 500,
                              }}
                            >
                              {row.currentStock} {row.unit}
                            </td>
                            <td
                              style={{
                                padding: "0.6rem 0.75rem",
                                textAlign: "center",
                                fontWeight: 800,
                                color: isZero
                                  ? "#dc2626"
                                  : isBottleNeck
                                  ? "#d97706"
                                  : "#15803d",
                              }}
                            >
                              {row.possiblePortions}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>
                              {row.isMissing ? (
                                <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.75rem" }}>
                                  ⚠️ Inexistente
                                </span>
                              ) : isZero ? (
                                <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.75rem" }}>
                                  🔴 Agotado
                                </span>
                              ) : isBottleNeck ? (
                                <span style={{ color: "#d97706", fontWeight: 700, fontSize: "0.75rem" }}>
                                  ⚡ Cuello de botella
                                </span>
                              ) : (
                                <span style={{ color: "#16a34a", fontSize: "0.75rem" }}>
                                  ✓ Suficiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1rem",
              }}
            >
              <Link
                href="/admin/inventory"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--accent-color)",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                📦 Ir a Inventario para Abastecer Insumos →
              </Link>
              <button
                onClick={() => setActiveModalProduct(null)}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
