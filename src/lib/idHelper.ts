/**
 * Genera un ID único combinando timestamp + random.
 * Diseñado para evitar colisiones en operaciones rápidas y secuenciales.
 * 
 * @param prefix - Prefijo del ID (ej: "p_", "ing_", "exp_")
 * @returns ID único con formato: {prefix}{timestamp36}_{random8}
 */
export const generateId = (prefix: string = ""): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}${timestamp}_${random}`;
};
