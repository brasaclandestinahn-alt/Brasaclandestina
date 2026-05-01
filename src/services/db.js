import { supabase } from "../lib/supabase";

/**
 * Registra una acción de auditoría en Supabase.
 * @param {string} userId - ID del usuario que realiza la acción.
 * @param {string} action - Descripción de la acción (ej: "CHANGE_PRICE").
 * @param {Object} details - Detalles técnicos del cambio.
 */
export const logAuditAction = async (userId, action, details) => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      details,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("Error al registrar auditoría:", error.message);
    }
  } catch (err) {
    console.error("Fallo crítico en el servicio de auditoría:", err);
  }
};
