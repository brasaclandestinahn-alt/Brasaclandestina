"use client";
import React from "react";
import { useState } from "react";
import { useAppState, uploadHeroImage } from "@/lib/useStore";
import AuthGuard from "@/components/Auth/AuthGuard";
<<<<<<< HEAD
import { Role, OrderStatusCategory, MOCK_CONFIG, BASE_UNITS } from "@/lib/mockDB";
=======
import { Role, OrderStatusCategory, MOCK_CONFIG, Discount } from "@/lib/mockDB";
>>>>>>> da057f8 (Implementación de sistema de descuentos y cupones en Admin y PWA)
import Sidebar from "@/components/Admin/Sidebar";
import { generateId } from "@/lib/idHelper";

export default function SettingsDashboard() {
  const { 
    state, 
    hydrated, 
    addEmployee, 
    removeEmployee,
    addOrderStatus, 
    editOrderStatus, 
    removeOrderStatus,
    addPaymentMethod,
    editPaymentMethod,
    removePaymentMethod,
    updateConfig,
<<<<<<< HEAD
    addCustomUnit,
    removeCustomUnit,
=======
    addDiscount,
    editDiscount,
    removeDiscount,
>>>>>>> da057f8 (Implementación de sistema de descuentos y cupones en Admin y PWA)
    signOut
  } = useAppState();
  
  // Tab State
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<"sar" | "employees" | "status" | "payments" | "general">("general");
  const [newUnitInput, setNewUnitInput] = useState("");
=======
  const [activeTab, setActiveTab] = useState<"sar" | "employees" | "status" | "payments" | "general" | "discounts">("general");
>>>>>>> da057f8 (Implementación de sistema de descuentos y cupones en Admin y PWA)

  // SAR Form State
  const [cai, setCai] = useState("000-001-01-00000000");
  const [rangoInicial, setRangoInicial] = useState("000-001-01-00000001");
  const [rangoFinal, setRangoFinal] = useState("000-001-01-00001000");
  const [fechaLimite, setFechaLimite] = useState("2026-12-31");
  const [isSaved, setIsSaved] = useState(false);

  // New employee form state
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState<Role>("vendedor");
  const [empPin, setEmpPin] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  // New status form state
  const [newStatusId, setNewStatusId] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#f59e0b");
  const [newStatusCategory, setNewStatusCategory] = useState<OrderStatusCategory>("initial");
  
  // New payment method form state
  const [newPayLabel, setNewPayLabel] = useState("");
  const [newPayIcon, setNewPayIcon] = useState("💵");
  const [newOptionName, setNewOptionName] = useState("");
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  
  // New discount form state
  const [discountType, setDiscountType] = useState<"percent"|"fixed"|"coupon">("percent");
  const [discountName, setDiscountName] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountLimit, setDiscountLimit] = useState("");

  // Hero upload state
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  // Hero texts local state (se guardan al presionar el botón)
  const [heroBadge, setHeroBadge] = useState("");
  const [heroLine1, setHeroLine1] = useState("");
  const [heroLine2, setHeroLine2] = useState("");
  const [heroDesc, setHeroDesc] = useState("");
  const [heroTextsSaved, setHeroTextsSaved] = useState(false);

  if (!hydrated) return null;

  const config = state.config || MOCK_CONFIG;

  // Inicializar estado local con valores del config (se hace en render, uníca vez al montar)
  if (!heroBadge && !heroLine1 && !heroLine2 && !heroDesc) {
    if (config.hero_badge)       setHeroBadge(config.hero_badge);
    if (config.hero_title_line1) setHeroLine1(config.hero_title_line1);
    if (config.hero_title_line2) setHeroLine2(config.hero_title_line2);
    if (config.hero_description) setHeroDesc(config.hero_description);
  }

  const handleSaveSAR = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empRole || !empPin) return alert("Faltan datos.");
    if (empPin.length < 4) return alert("El PIN debe tener 4 dígitos.");
    
    setIsAdding(true);
    // Simulando delay para efecto "loading"
    setTimeout(() => {
      addEmployee({
        id: "e_" + Math.random().toString(36).substr(2, 6),
        name: empName,
        email: empEmail || undefined,
        role: empRole,
        pin: empPin
      });
      
      setEmpName("");
      setEmpEmail("");
      setEmpPin("");
      setIsAdding(false);
    }, 800);
  };

  const handleHeroUpload = async (file: File) => {
    if (!file) return;
    
    // Validar tipo y tamaño
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setHeroUploadError("Solo se permiten imágenes JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHeroUploadError("La imagen no puede superar 5MB.");
      return;
    }
    
    setHeroUploading(true);
    setHeroUploadError(null);
    
    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setHeroPreview(localUrl);
    
    try {
      const publicUrl = await uploadHeroImage(file);
      updateConfig({ hero_image_url: publicUrl });
      setHeroPreview(null); // ya no necesitamos el preview local
    } catch (err: any) {
      setHeroUploadError(err.message || "Error al subir la imagen.");
      setHeroPreview(null);
    } finally {
      setHeroUploading(false);
    }
  };

  const handleSaveHeroTexts = () => {
    updateConfig({
      hero_badge: heroBadge,
      hero_title_line1: heroLine1,
      hero_title_line2: heroLine2,
      hero_description: heroDesc,
    });
    setHeroTextsSaved(true);
    setTimeout(() => setHeroTextsSaved(false), 2500);
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="admin-layout">
        <Sidebar />

        <main className="main-content-responsive">
          
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>Ajustes y Configuración</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>Panel centralizado para administrar el sistema tributario y el talento humano de tu negocio.</p>
          </header>

          {/* Pill Tabs Navigation */}
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
          }}>
            <button onClick={() => setActiveTab("general")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "general" ? "var(--accent-color)" : "transparent", color: activeTab === "general" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>⚙️ General</button>
            <button onClick={() => setActiveTab("sar")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "sar" ? "var(--accent-color)" : "transparent", color: activeTab === "sar" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>📋 SAR/Fiscal</button>
            <button onClick={() => setActiveTab("employees")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "employees" ? "var(--accent-color)" : "transparent", color: activeTab === "employees" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>👥 Empleados</button>
            <button onClick={() => setActiveTab("status")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "status" ? "var(--accent-color)" : "transparent", color: activeTab === "status" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>🕒 Estados</button>
            <button onClick={() => setActiveTab("payments")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "payments" ? "var(--accent-color)" : "transparent", color: activeTab === "payments" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>💳 Pagos</button>
            <button onClick={() => setActiveTab("discounts")} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "discounts" ? "var(--accent-color)" : "transparent", color: activeTab === "discounts" ? "white" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>🏷️ Descuentos</button>
          </div>
        
        {/* TAB 0: Ajustes Generales */}
        {activeTab === "general" && (
          <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración de la Tienda</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Activa o desactiva funciones del Menú Digital (PWA) de cara al cliente.</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "2.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Habilitar Programación de Pedidos</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Permite a los clientes agendar su entrega en intervalos de 30 minutos.</p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                  <input 
                    type="checkbox" 
                    style={{ opacity: 0, width: 0, height: 0 }}
                    checked={config.is_schedule_enabled}
                    onChange={(e) => updateConfig({ is_schedule_enabled: e.target.checked })}
                  />
                  <span style={{ 
                    position: 'absolute', cursor: 'pointer', inset: 0, 
                    backgroundColor: config.is_schedule_enabled ? 'var(--accent-color)' : '#334155', 
                    borderRadius: '34px', transition: 'var(--transition-fast)' 
                  }}>
                    <span style={{ 
                      position: 'absolute', content: '""', height: '22px', width: '22px', 
                      left: config.is_schedule_enabled ? '34px' : '4px', bottom: '4px',
                      backgroundColor: 'white', borderRadius: '50%', transition: 'var(--transition-fast)',
                      boxShadow: 'var(--shadow-md)'
                    }} />
                  </span>
                </label>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--accent-red)" }}>Canales de Venta y Enlaces</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>NÚMERO DE WHATSAPP</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.whatsapp_number || ""} 
                    onChange={e => updateConfig({ whatsapp_number: e.target.value })}
                    placeholder="+504 0000-0000"
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>MENSAJE PREDETERMINADO</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.whatsapp_message || ""} 
                    onChange={e => updateConfig({ whatsapp_message: e.target.value })}
                    placeholder="Hola, quiero hacer un pedido..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE RAPPI</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.rappi_link || ""} 
                    onChange={e => updateConfig({ rappi_link: e.target.value })}
                    placeholder="https://www.rappi.com.hn/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE UBER EATS</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.ubereats_link || ""} 
                    onChange={e => updateConfig({ ubereats_link: e.target.value })}
                    placeholder="https://www.ubereats.com/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE PEDIDOSYA</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.pedidosya_link || ""} 
                    onChange={e => updateConfig({ pedidosya_link: e.target.value })}
                    placeholder="https://www.pedidosya.com.hn/..."
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.75rem", color: "var(--text-muted)" }}>ENLACE INSTAGRAM</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={config.instagram_link || ""} 
                    onChange={e => updateConfig({ instagram_link: e.target.value })}
                    placeholder="https://www.instagram.com/..."
                  />
                </div>
              </div>

              <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ 
                    display: "block", fontWeight: 700, 
                    marginBottom: "0.5rem", fontSize: "0.85rem" 
                  }}>
                    🖼️ Foto del Hero
                  </label>

                  {/* Preview actual o en proceso */}
                  {(heroPreview || config.hero_image_url) && (
                    <div style={{ 
                      marginBottom: "1rem", 
                      borderRadius: "var(--radius-md)", 
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      position: "relative",
                      aspectRatio: "16/5",
                      background: "#000"
                    }}>
                      <img
                        src={heroPreview || config.hero_image_url}
                        alt="Preview hero"
                        style={{ 
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          opacity: heroUploading ? 0.4 : 1,
                          transition: "opacity 0.3s"
                        }}
                      />
                      {heroUploading && (
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", 
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.5)"
                        }}>
                          <span style={{ 
                            color: "white", fontWeight: 700, fontSize: "0.9rem" 
                          }}>
                            ⏳ Subiendo...
                          </span>
                        </div>
                      )}
                      {/* Botón quitar imagen */}
                      {!heroUploading && (config.hero_image_url || heroPreview) && (
                        <button
                          onClick={() => {
                            updateConfig({ hero_image_url: "" });
                            setHeroPreview(null);
                          }}
                          style={{
                            position: "absolute", top: 8, right: 8,
                            background: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "100px",
                            color: "white", fontSize: "11px",
                            fontWeight: 700, padding: "4px 10px",
                            cursor: "pointer"
                          }}
                        >
                          ✕ Quitar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Zona de drag & drop / click para subir */}
                  <label 
                    htmlFor="hero-upload"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      border: `2px dashed ${heroUploading ? "var(--accent-color)" : "var(--border-color)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "24px 16px",
                      cursor: heroUploading ? "not-allowed" : "pointer",
                      background: "var(--bg-secondary)",
                      transition: "all 0.2s",
                      marginBottom: "0.75rem"
                    }}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleHeroUpload(file);
                    }}
                  >
                    <span style={{ fontSize: "2rem" }}>
                      {heroUploading ? "⏳" : "📷"}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ 
                        margin: 0, fontWeight: 700, fontSize: "0.85rem",
                        color: "var(--text-primary)"
                      }}>
                        {heroUploading 
                          ? "Subiendo imagen..." 
                          : "Arrastra tu foto aquí o haz clic para seleccionar"}
                      </p>
                      <p style={{ 
                        margin: "4px 0 0", fontSize: "0.75rem", 
                        color: "var(--text-muted)" 
                      }}>
                        JPG, PNG o WebP · Máximo 5MB · Recomendado 1600px+
                      </p>
                    </div>
                    <input
                      id="hero-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={heroUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHeroUpload(file);
                        e.target.value = ""; // reset para poder subir el mismo archivo otra vez
                      }}
                    />
                  </label>

                  {/* Separador "o" */}
                  <div style={{ 
                    display: "flex", alignItems: "center", 
                    gap: "12px", marginBottom: "0.75rem" 
                  }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
                    <span style={{ 
                      fontSize: "0.75rem", color: "var(--text-muted)", 
                      fontWeight: 600 
                    }}>
                      o usa una URL
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
                  </div>

                  {/* Input URL manual */}
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://ejemplo.com/foto-parrilla.jpg"
                    value={config.hero_image_url || ""}
                    onChange={(e) => {
                      updateConfig({ hero_image_url: e.target.value });
                      setHeroPreview(null);
                    }}
                  />

                  {/* Error message */}
                  {heroUploadError && (
                    <p style={{ 
                      marginTop: "0.5rem", fontSize: "0.78rem", 
                      color: "#E8603C", fontWeight: 600 
                    }}>
                      ⚠️ {heroUploadError}
                    </p>
                  )}

                  <p style={{ 
                    fontSize: "0.75rem", color: "var(--text-muted)", 
                    marginTop: "0.5rem" 
                  }}>
                    Esta foto aparece como fondo del menú principal. 
                    Una foto de la parrilla con fuego funciona muy bien.
                  </p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ 
                    display: "block", fontWeight: 700, 
                    marginBottom: "0.5rem", fontSize: "0.85rem" 
                  }}>
                    🎯 Food Cost Objetivo (%)
                  </label>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="number"
                      min={10}
                      max={60}
                      step={1}
                      className="input-field"
                      style={{ maxWidth: "120px" }}
                      value={state.config?.food_cost_target ?? 35}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 10 && val <= 60) {
                          updateConfig({ food_cost_target: val });
                        }
                      }}
                    />
                    <span style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--text-muted)" 
                    }}>%</span>
                    
                    {/* Indicador visual del umbral */}
                    <div style={{ 
                      display: "flex", gap: "8px", alignItems: "center",
                      marginLeft: "8px"
                    }}>
                      <span style={{ 
                        fontSize: "0.75rem", fontWeight: 700,
                        padding: "3px 10px", borderRadius: "100px",
                        background: "rgba(34,197,94,0.15)",
                        color: "#22c55e",
                        border: "1px solid rgba(34,197,94,0.3)"
                      }}>
                        ✓ Bajo {state.config?.food_cost_target ?? 35}% = OK
                      </span>
                      <span style={{ 
                        fontSize: "0.75rem", fontWeight: 700,
                        padding: "3px 10px", borderRadius: "100px",
                        background: "rgba(232,96,60,0.15)",
                        color: "#E8603C",
                        border: "1px solid rgba(232,96,60,0.3)"
                      }}>
                        ⚠ Sobre {state.config?.food_cost_target ?? 35}% = Alerta
                      </span>
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: "0.75rem", color: "var(--text-muted)", 
                    marginTop: "0.5rem" 
                  }}>
                    Porcentaje máximo de costo de insumos respecto al precio 
                    de venta. Estándar industria restaurantes: 28-35%.
                  </p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ 
                    display: "block", fontWeight: 700, 
                    marginBottom: "0.5rem", fontSize: "0.85rem" 
                  }}>
                    📏 Unidades de Medida
                  </label>
                  <p style={{ 
                    fontSize: "0.78rem", color: "var(--text-muted)", 
                    marginBottom: "1rem" 
                  }}>
                    Estas unidades estarán disponibles al crear o editar insumos.
                  </p>

                  {/* Unidades base (solo visualización) */}
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ 
                      fontSize: "0.72rem", fontWeight: 700, 
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.05em", marginBottom: "6px"
                    }}>
                      Unidades base del sistema
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {BASE_UNITS.map(u => (
                        <span key={u.value} style={{
                          padding: "4px 10px",
                          borderRadius: "100px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-muted)"
                        }}>
                          {u.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Unidades personalizadas */}
                  <div>
                    <p style={{ 
                      fontSize: "0.72rem", fontWeight: 700, 
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.05em", marginBottom: "6px"
                    }}>
                      Unidades personalizadas
                    </p>

                    {/* Lista de unidades personalizadas */}
                    {(state.config?.custom_units || []).length === 0 ? (
                      <p style={{ 
                        fontSize: "0.8rem", color: "var(--text-muted)", 
                        fontStyle: "italic", marginBottom: "8px" 
                      }}>
                        Aún no has creado unidades personalizadas.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                        {(state.config?.custom_units || []).map((u: string) => (
                          <div key={u} style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 6px 4px 10px",
                            borderRadius: "100px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: "rgba(232,96,60,0.08)",
                            border: "1px solid rgba(232,96,60,0.3)",
                            color: "var(--accent-color)"
                          }}>
                            {u}
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar la unidad "${u}"?`)) {
                                  removeCustomUnit(u);
                                }
                              }}
                              style={{
                                background: "none", border: "none",
                                cursor: "pointer", color: "var(--accent-color)",
                                fontSize: "12px", padding: "0 2px",
                                lineHeight: 1, opacity: 0.7
                              }}
                              title={`Eliminar ${u}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input para agregar nueva unidad */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="text"
                        className="input-field-admin"
                        placeholder="Ej: pza, ración, bolsa, bandeja..."
                        value={newUnitInput}
                        onChange={e => setNewUnitInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newUnitInput.trim()) {
                            addCustomUnit(newUnitInput.trim());
                            setNewUnitInput("");
                          }
                        }}
                        style={{ maxWidth: "240px" }}
                      />
                      <button
                        onClick={() => {
                          if (!newUnitInput.trim()) return;
                          addCustomUnit(newUnitInput.trim());
                          setNewUnitInput("");
                        }}
                        className="btn-primary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        + Agregar
                      </button>
                    </div>
                    <p style={{ 
                      fontSize: "0.72rem", color: "var(--text-muted)", 
                      marginTop: "6px" 
                    }}>
                      Tip: Presiona Enter para agregar rápidamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── TEXTO DEL HERO ── */}
              <div style={{ 
                marginTop: "2rem", paddingTop: "2rem", 
                borderTop: "1px solid var(--border-color)" 
              }}>
                <h3 style={{ 
                  fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" 
                }}>
                  ✍️ Textos del Hero
                </h3>
                <p style={{ 
                  fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem" 
                }}>
                  Personaliza cada línea que aparece sobre la imagen de fondo.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Badge */}
                  <div>
                    <label style={{ 
                      display: "block", fontWeight: 700, fontSize: "0.75rem",
                      color: "var(--text-muted)", marginBottom: "0.4rem", 
                      textTransform: "uppercase", letterSpacing: "0.06em" 
                    }}>
                      Etiqueta pequeña (badge)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: EXPERIENCIA ARTESANAL"
                      value={heroBadge}
                      onChange={(e) => setHeroBadge(e.target.value)}
                    />
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Aparece en la pastilla naranja sobre el título.
                    </p>
                  </div>

                  {/* Título línea 1 */}
                  <div>
                    <label style={{ 
                      display: "block", fontWeight: 700, fontSize: "0.75rem",
                      color: "var(--text-muted)", marginBottom: "0.4rem",
                      textTransform: "uppercase", letterSpacing: "0.06em" 
                    }}>
                      Título — Primera línea (blanca)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: EL SABOR DE LA"
                      value={heroLine1}
                      onChange={(e) => setHeroLine1(e.target.value)}
                    />
                  </div>

                  {/* Título línea 2 */}
                  <div>
                    <label style={{ 
                      display: "block", fontWeight: 700, fontSize: "0.75rem",
                      color: "var(--text-muted)", marginBottom: "0.4rem",
                      textTransform: "uppercase", letterSpacing: "0.06em" 
                    }}>
                      Título — Segunda línea <span style={{ color: "#E8603C" }}>(naranja)</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: BRASA REAL."
                      value={heroLine2}
                      onChange={(e) => setHeroLine2(e.target.value)}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label style={{ 
                      display: "block", fontWeight: 700, fontSize: "0.75rem",
                      color: "var(--text-muted)", marginBottom: "0.4rem",
                      textTransform: "uppercase", letterSpacing: "0.06em" 
                    }}>
                      Descripción
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="Ej: Hamburguesas y cortes premium preparados con fuego de leña..."
                      value={heroDesc}
                      onChange={(e) => setHeroDesc(e.target.value)}
                      style={{ resize: "vertical", lineHeight: 1.6 }}
                    />
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Texto que aparece debajo del título, antes de los íconos de prueba social.
                    </p>
                  </div>

                  {/* Botón guardar */}
                  <div style={{ 
                    display: "flex", alignItems: "center", gap: "16px", 
                    paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" 
                  }}>
                    <button
                      onClick={handleSaveHeroTexts}
                      disabled={heroTextsSaved}
                      style={{
                        padding: "11px 28px",
                        borderRadius: "10px",
                        border: "none",
                        background: heroTextsSaved ? "#2D9F6B" : "#E8603C",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: heroTextsSaved ? "default" : "pointer",
                        transition: "all 0.25s ease",
                        letterSpacing: "0.04em",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: heroTextsSaved 
                          ? "0 4px 12px rgba(45,159,107,0.3)" 
                          : "0 4px 12px rgba(232,96,60,0.35)"
                      }}
                    >
                      {heroTextsSaved ? "✓ Cambios Guardados" : "💾 Guardar Textos del Hero"}
                    </button>
                    {heroTextsSaved && (
                      <span style={{ 
                        fontSize: "0.78rem", color: "#2D9F6B", 
                        fontWeight: 600, animation: "fadeIn 0.3s ease" 
                      }}>
                        Los cambios ya se ven en el menú.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Configuración SAR */}
        {activeTab === "sar" && (
          <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease-in-out" }}>
            <form onSubmit={handleSaveSAR} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Opción de habilitar impuestos */}
              <div style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" 
              }}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>Impuesto ISV (15%)</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Calcula y muestra el impuesto en el carrito y checkout del menú digital.
                  </p>
                </div>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                  <input 
                    type="checkbox" 
                    checked={config.is_tax_enabled ?? true}
                    onChange={(e) => updateConfig({ is_tax_enabled: e.target.checked })}
                    style={{ opacity: 0, position: "absolute", width: 0, height: 0 }}
                  />
                  <div style={{
                    width: 50, height: 26, borderRadius: 50,
                    background: (config.is_tax_enabled ?? true) ? "var(--accent-color)" : "rgba(255,255,255,0.1)",
                    border: (config.is_tax_enabled ?? true) ? "none" : "1px solid var(--border-color)",
                    position: "relative", transition: "all 0.3s"
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: (config.is_tax_enabled ?? true) ? 26 : 2,
                      width: 22, height: 22, borderRadius: "50%", background: "#fff",
                      transition: "all 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }} />
                  </div>
                </label>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Clave de Autorización de Impresión (CAI)</label>
                <input 
                  type="text" 
                  value={cai}
                  onChange={(e) => setCai(e.target.value)}
                  className="input-field" 
                  style={{ fontFamily: "monospace", letterSpacing: "1px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rango Inicial Autorizado</label>
                  <input 
                    type="text" 
                    value={rangoInicial}
                    onChange={(e) => setRangoInicial(e.target.value)}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rango Final Autorizado</label>
                  <input 
                    type="text" 
                    value={rangoFinal}
                    onChange={(e) => setRangoFinal(e.target.value)}
                    className="input-field" 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Fecha Límite de Emisión</label>
                <input 
                  type="date" 
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="input-field" 
                />
              </div>

              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="submit" className="btn-primary">
                  Actualizar Credenciales Fiscales
                </button>
                {isSaved && <span style={{ color: "var(--success)", fontWeight: 600 }}>¡Configuración Guardada!</span>}
              </div>
            </form>

            <div className="glass-panel" style={{ padding: "2rem", marginTop: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Libro de Ventas Diarias</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>Exporta el reporte en formato CSV validado para la declaración en línea del SAR.</p>
              <button className="btn-primary" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                📥 Exportar Libro de Ventas (CSV)
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Gestión de Talento */}
        {activeTab === "employees" && (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {/* Registro de Talento */}
            <div style={{ 
              backgroundColor: "white", padding: "2rem", borderRadius: "1.25rem", 
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "2rem" 
            }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1A1714", margin: 0 }}>Gestión de Talento</h2>
                <p style={{ color: "#5C5550", fontSize: "13px", marginTop: "4px" }}>Añade nuevos especialistas a tu equipo operativo.</p>
              </div>

              <form onSubmit={handleAddEmployee} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#5C5550", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>Nombre Completo *</label>
                    <input type="text" className="saas-input" placeholder="Ej. Ana Martínez" value={empName} onChange={e => setEmpName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#5C5550", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>Email (Opcional)</label>
                    <input type="email" className="saas-input" placeholder="ana@brasaclandestina.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#5C5550", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>Rol Operativo *</label>
                    <select className="saas-input" value={empRole} onChange={e => setEmpRole(e.target.value as Role)} required>
                      <option value="vendedor">Mesero / Cajero</option>
                      <option value="repartidor">Repartidor (Delivery)</option>
                      <option value="cocinero">Staff de Cocina</option>
                      <option value="admin">Súper Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#5C5550", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>PIN Acceso (4 dgt) *</label>
                    <input type="password" maxLength={4} className="saas-input" placeholder="****" style={{ textAlign: "center", letterSpacing: "0.5em", fontWeight: 900 }}
                      value={empPin} onChange={e => setEmpPin(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={isAdding} style={{
                    padding: "12px", borderRadius: "10px", background: "#E8593C", color: "white", 
                    border: "none", fontWeight: 800, fontSize: "14px", cursor: isAdding ? "not-allowed" : "pointer",
                    transition: "all 0.2s", opacity: isAdding ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                  }}>
                    {isAdding ? "REGISTRANDO..." : "REGISTRAR ESPECIALISTA"}
                  </button>
                </div>
              </form>
            </div>

            {/* Equipo Activo */}
            <div style={{ 
              backgroundColor: "white", padding: "1.5rem", borderRadius: "1.25rem", 
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)" 
            }}>
              <div style={{ padding: "0.5rem 0.5rem 1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1A1714", margin: 0 }}>Equipo Activo</h2>
                <p style={{ color: "#5C5550", fontSize: "12px", marginTop: "4px" }}>{state.employees.length} integrantes en total</p>
              </div>

              {state.employees.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", background: "#FAFAFA", borderRadius: "1rem", border: "2px dashed #EBEBEB" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                  <h3 style={{ color: "#1A1714", margin: "0 0 0.5rem", fontSize: "1rem" }}>No hay integrantes registrados</h3>
                  <p style={{ color: "#5C5550", fontSize: "13px", maxWidth: "240px", margin: "0 auto" }}>Empieza reclutando a tu primer especialista arriba.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#5C5550", fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em" }}>
                        <th style={{ padding: "0 1rem" }}>INTEGRANTE</th>
                        <th style={{ padding: "0 1rem" }}>ROL</th>
                        <th style={{ padding: "0 1rem" }}>SISTEMA</th>
                        <th style={{ padding: "0 1rem", textAlign: "right" }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.employees.map(emp => {
                        const initials = emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                        const roleColors: Record<string, {bg: string, text: string}> = {
                          admin: { bg: "#EAF3DE", text: "#27500A" },
                          vendedor: { bg: "#E0F2FE", text: "#0369A1" },
                          repartidor: { bg: "#FEF3C7", text: "#92400E" },
                          cocinero: { bg: "#F3E8FF", text: "#6B21A8" }
                        };
                        const colors = roleColors[emp.role] || { bg: "#F1F5F9", text: "#475569" };
                        
                        return (
                          <tr key={emp.id} className="team-row" style={{ backgroundColor: "#FFFFFF", transition: "all 0.2s" }}>
                            <td style={{ padding: "0.75rem 1rem", borderRadius: "12px 0 0 12px", border: "1px solid #EBEBEB", borderRight: "none" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ 
                                  width: "36px", height: "36px", borderRadius: "50%", background: "#F5F2EE", 
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#E8593C", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                                }}>
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: "#1A1714", fontSize: "14px" }}>{emp.name}</div>
                                  <div style={{ fontSize: "11px", color: "#5C5550" }}>{emp.email || "Sin acceso web"}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", borderTop: "1px solid #EBEBEB", borderBottom: "1px solid #EBEBEB" }}>
                              <span style={{ 
                                padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase",
                                backgroundColor: colors.bg, color: colors.text
                              }}>
                                {emp.role}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", borderTop: "1px solid #EBEBEB", borderBottom: "1px solid #EBEBEB", fontFamily: "monospace", fontSize: "14px", color: "#A09890" }}>
                              ****
                            </td>
                            <td style={{ padding: "0.75rem 1rem", borderRadius: "0 12px 12px 0", border: "1px solid #EBEBEB", borderLeft: "none", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button title="Editar" style={{ background: "#F5F2EE", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>✏️</button>
                                <button 
                                  title="Eliminar" 
                                  onClick={() => { if(confirm(`¿Remover a ${emp.name}?`)) removeEmployee(emp.id) }}
                                  style={{ background: "#FEF2F2", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                                >🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Estados de Pedido */}
        {activeTab === "status" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Configurar Flujo de Trabajo</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>Crea estados personalizados para que tus pedidos fluyan por el KDS y el Delivery de forma ordenada.</p>
              
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Etiqueta (Label)</label>
                  <input type="text" className="input-field" placeholder="Ej. Empacando" value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Módulo Destino</label>
                  <select className="input-field" value={newStatusCategory} onChange={e => setNewStatusCategory(e.target.value as OrderStatusCategory)}>
                    <option value="initial">Pantalla Inicial / Caja</option>
                    <option value="kitchen">KDS (Pantalla de Cocina)</option>
                    <option value="transit">Repartidor (En Camino)</option>
                    <option value="done">Completados / Historial</option>
                  </select>
                </div>
                <div style={{ width: "60px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Color</label>
                  <input type="color" className="input-field" style={{ padding: "0", height: "42px" }} value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} />
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    if (!newStatusLabel) return alert("Ponle un nombre al estado.");
                    addOrderStatus({
                      id: newStatusLabel.toLowerCase().replace(/\s+/g, '_'),
                      label: newStatusLabel,
                      color: newStatusColor,
                      category: newStatusCategory,
                      order: state.orderStatuses.length + 1
                    });
                    setNewStatusLabel("");
                  }}
                >+ Agregar</button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Mapa de Estados Actual</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {state.orderStatuses.sort((a, b) => a.order - b.order).map((status) => (
                        <div key={status.id} style={{ 
                            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                            backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", 
                            border: "1px solid var(--border-color)", borderLeft: `5px solid ${status.color}`
                        }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: 700 }}>{status.label}</h4>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Modulo: {status.category}</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button style={{ background: "none", border: "none", cursor: "pointer" }}>✏️</button>
                                <button 
                                    onClick={() => removeOrderStatus(status.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer" }}
                                >🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* TAB 4: Métodos de Pago */}
        {activeTab === "payments" && (
          <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            
            {/* Opciones del Checkout */}
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Opciones del Checkout
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Personaliza qué campos verá el cliente en el formulario de pedido.
              </p>

              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "1rem", 
                background: "var(--bg-secondary)", 
                borderRadius: "var(--radius-md)", 
                border: "1px solid var(--border-color)" 
              }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                    📝 Notas para cocina
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Permite que el cliente agregue indicaciones especiales (ej: "sin cebolla", "bien cocido").
                  </p>
                </div>
                
                <label style={{ 
                  position: "relative", 
                  display: "inline-block", 
                  width: "48px", 
                  height: "26px",
                  cursor: "pointer",
                  flexShrink: 0
                }}>
                  <input
                    type="checkbox"
                    checked={state.config?.enable_kitchen_notes || false}
                    onChange={(e) => updateConfig({ 
                      enable_kitchen_notes: e.target.checked 
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: state.config?.enable_kitchen_notes 
                      ? "var(--accent-color)" 
                      : "var(--border-color)",
                    borderRadius: "100px",
                    transition: "0.3s"
                  }}>
                    <span style={{
                      position: "absolute",
                      top: "3px",
                      left: state.config?.enable_kitchen_notes ? "25px" : "3px",
                      width: "20px",
                      height: "20px",
                      background: "white",
                      borderRadius: "50%",
                      transition: "0.3s",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }} />
                  </span>
                </label>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Habilitar Métodos de Cobro</h2>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ width: "60px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Icono</label>
                  <input type="text" className="input-field" value={newPayIcon} onChange={e => setNewPayIcon(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Nombre del Método</label>
                  <input type="text" className="input-field" placeholder="Ej. Bitcoin" value={newPayLabel} onChange={e => setNewPayLabel(e.target.value)} />
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    if (!newPayLabel) return;
                    addPaymentMethod({
                        id: newPayLabel.toLowerCase().replace(/\s+/g, '_'),
                        label: newPayLabel,
                        icon: newPayIcon,
                        is_active: true
                    });
                    setNewPayLabel("");
                  }}
                >+ Habilitar</button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Pasarelas Activas</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <th style={{ padding: "1rem" }}>METODO</th>
                    <th style={{ padding: "1rem" }}>ESTADO</th>
                    <th style={{ padding: "1rem" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {state.paymentMethods.map(pm => (
                    <tr key={pm.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: pm.is_active ? 1 : 0.6 }}>
                      <td style={{ padding: "1rem", fontWeight: 700 }}>{pm.icon} {pm.label}</td>
                      <td style={{ padding: "1rem" }}>{pm.is_active ? "Activo" : "Pausado"}</td>
                      <td style={{ padding: "1rem" }}>
                        <button 
                            onClick={() => editPaymentMethod(pm.id, { is_active: !pm.is_active })}
                            style={{ color: "var(--accent-color)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                            {pm.is_active ? "Pausar" : "Reanudar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sub-options Management (e.g. Banks) */}
            <div style={{ marginTop: "3rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración de Bancos (Transferencias)</h2>
                {(() => {
                    const transMethod = state.paymentMethods.find(pm => pm.id === "transferencia");
                    if (!transMethod) return <p style={{ color: "var(--text-muted)" }}>Habilite 'Transferencia Bancaria' para configurar bancos.</p>;
                    
                    return (
                        <div className="glass-panel" style={{ padding: "2rem" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Administra los bancos disponibles para que tus clientes realicen transferencias.</p>
                            
                            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Nombre del Banco (ej: Ficohsa)" 
                                    value={newOptionName}
                                    onChange={e => setNewOptionName(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    className="btn-primary"
                                    onClick={() => {
                                        if (!newOptionName) return;
                                        const currentOptions = transMethod.options || [];
                                        editPaymentMethod(transMethod.id, { 
                                            options: [...currentOptions, { label: newOptionName, is_active: true }] 
                                        });
                                        setNewOptionName("");
                                    }}
                                >+ Agregar Banco</button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {(transMethod.options || []).map((rawOption, idx) => {
                                    // Normalización para compatibilidad con datos antiguos (strings)
                                    const option = typeof rawOption === "string" 
                                        ? { label: rawOption, is_active: true } 
                                        : rawOption;

                                    return (
                                        <div key={idx} style={{ 
                                            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                                            backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", 
                                            border: "1px solid var(--border-color)", opacity: option.is_active ? 1 : 0.6 
                                        }}>
                                        <div style={{ flex: 1 }}>
                                            {editingOptionIndex === idx ? (
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        value={option.label}
                                                        onChange={e => {
                                                            const newOptions = [...(transMethod.options || [])];
                                                            newOptions[idx] = { ...option, label: e.target.value };
                                                            editPaymentMethod(transMethod.id, { options: newOptions });
                                                        }}
                                                        autoFocus
                                                        style={{ fontWeight: 700, fontSize: "1rem" }}
                                                    />
                                                    <button 
                                                        onClick={() => setEditingOptionIndex(null)}
                                                        className="btn-primary"
                                                        style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                                    >Listo</button>
                                                </div>
                                            ) : (
                                                <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>{option.label}</span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                            {editingOptionIndex !== idx && (
                                                <button 
                                                    onClick={() => setEditingOptionIndex(idx)}
                                                    style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem" }}
                                                    title="Editar nombre"
                                                >✏️</button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    const newOptions = [...(transMethod.options || [])];
                                                    const currentOpt = typeof rawOption === "string" ? { label: rawOption, is_active: true } : rawOption;
                                                    newOptions[idx] = { ...currentOpt, is_active: !currentOpt.is_active };
                                                    editPaymentMethod(transMethod.id, { options: newOptions });
                                                }}
                                                style={{ 
                                                    background: option.is_active ? "var(--bg-primary)" : "var(--accent-color)", 
                                                    color: option.is_active ? "var(--text-primary)" : "white",
                                                    border: "1px solid var(--border-color)", padding: "0.4rem 0.8rem", 
                                                    borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600
                                                }}
                                            >
                                                {option.is_active ? "Inhabilitar" : "Habilitar"}
                                            </button>
                                            
                                            <button 
                                                onClick={() => {
                                                    const newOptions = (transMethod.options || []).filter((_, i) => i !== idx);
                                                    editPaymentMethod(transMethod.id, { options: newOptions });
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                                                title="Eliminar banco"
                                            >🗑️</button>
                                        </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
          </div>
        )}

        {/* TAB 5: Descuentos */}
        {activeTab === "discounts" && (
          <div style={{ maxWidth: "700px", animation: "fadeIn 0.3s ease-in-out" }}>
            
            {/* Crear nuevo descuento */}
            <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
                + Crear nuevo descuento
              </h3>
              
              {/* Selector de tipo */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                  { key: "percent", label: "% Porcentaje", desc: "Ej: 10% off" },
                  { key: "fixed", label: "L. Valor fijo", desc: "Ej: L. 50 off" },
                  { key: "coupon", label: "🎟 Cupón", desc: "Código único" }
                ].map(t => (
                  <button key={t.key} onClick={() => setDiscountType(t.key as any)}
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)",
                      border: discountType === t.key ? "none" : "1px solid var(--border-color)",
                      background: discountType === t.key ? "#E8603C" : "transparent",
                      color: discountType === t.key ? "white" : "var(--text-muted)",
                      fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                    {t.label}
                    <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 400, opacity: 0.8 }}>{t.desc}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div style={{ flex: 2, minWidth: "160px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    NOMBRE DEL DESCUENTO
                  </label>
                  <input className="input-field-admin" value={discountName} 
                    onChange={e => setDiscountName(e.target.value)}
                    placeholder={discountType === "coupon" ? "Ej: Descuento Clientes VIP" : "Ej: Descuento fin de semana"}
                    style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1, minWidth: "100px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    {discountType === "percent" ? "PORCENTAJE (%)" : "VALOR (L.)"}
                  </label>
                  <input className="input-field-admin" type="number" value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "10" : "50"}
                    min="0" step={discountType === "percent" ? "1" : "0.01"}
                    style={{ width: "100%" }} />
                </div>
              </div>

              {discountType === "coupon" && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                      CÓDIGO DEL CUPÓN
                    </label>
                    <input className="input-field-admin" value={discountCode}
                      onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="VERANO25"
                      style={{ width: "100%", fontFamily: "monospace", letterSpacing: "0.1em" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                      LÍMITE DE USOS (vacío = ilimitado)
                    </label>
                    <input className="input-field-admin" type="number" value={discountLimit}
                      onChange={e => setDiscountLimit(e.target.value)}
                      placeholder="100" min="1"
                      style={{ width: "100%" }} />
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!discountName.trim() || !discountValue) return;
                  if (discountType === "coupon" && !discountCode.trim()) {
                    alert("El cupón requiere un código."); return;
                  }
                  addDiscount({
                    id: generateId("disc_"),
                    name: discountName.trim(),
                    type: discountType,
                    value: Number(discountValue),
                    code: discountType === "coupon" ? discountCode.trim() : undefined,
                    is_active: true,
                    uses_limit: discountLimit ? Number(discountLimit) : undefined,
                    uses_count: 0
                  });
                  setDiscountName(""); setDiscountValue(""); 
                  setDiscountCode(""); setDiscountLimit("");
                }}
                style={{ padding: "0.6rem 1.5rem", background: "#E8603C", color: "white",
                  border: "none", borderRadius: "var(--radius-sm)", fontWeight: 800,
                  fontSize: "0.875rem", cursor: "pointer" }}
              >
                Crear descuento
              </button>
            </div>

            {/* Lista de descuentos */}
            <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
              {(state.discounts || []).length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🏷️</p>
                  <p style={{ fontWeight: 600 }}>Sin descuentos creados</p>
                  <p style={{ fontSize: "0.8rem" }}>Crea tu primer descuento arriba.</p>
                </div>
              ) : (state.discounts || []).map((d: Discount) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", 
                  alignItems: "center", padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border-color)",
                  opacity: d.is_active ? 1 : 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{d.name}</span>
                      <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "11px",
                        fontWeight: 800, background: d.type === "percent" ? "rgba(232,96,60,0.1)" : 
                          d.type === "fixed" ? "rgba(34,197,94,0.1)" : "rgba(124,58,237,0.1)",
                        color: d.type === "percent" ? "#E8603C" : d.type === "fixed" ? "#16a34a" : "#7c3aed" }}>
                        {d.type === "percent" ? `${d.value}%` : d.type === "fixed" ? `L. ${d.value}` : `🎟 ${d.code}`}
                      </span>
                      {d.type === "coupon" && (
                        <span style={{ fontFamily: "monospace", fontSize: "12px", 
                          padding: "2px 8px", background: "var(--bg-tertiary)",
                          borderRadius: "4px", letterSpacing: "0.1em" }}>
                          {d.code}
                        </span>
                      )}
                    </div>
                    {d.uses_limit && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
                        {d.uses_count} / {d.uses_limit} usos
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button onClick={() => editDiscount(d.id, { is_active: !d.is_active })}
                      style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px",
                        fontWeight: 700, cursor: "pointer",
                        border: "1px solid var(--border-color)",
                        background: d.is_active ? "rgba(34,197,94,0.1)" : "transparent",
                        color: d.is_active ? "#16a34a" : "var(--text-muted)" }}>
                      {d.is_active ? "Activo" : "Inactivo"}
                    </button>
                    <button onClick={() => { if (confirm(`¿Eliminar "${d.name}"?`)) removeDiscount(d.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: "1rem" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          <div style={{ marginTop: "4rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem", textAlign: "center" }}>
             <button onClick={signOut} className="btn-primary" style={{ backgroundColor: "transparent", border: "1px solid #ef4444", color: "#ef4444" }}>
                Cerrar Sesión de Administrador
             </button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
