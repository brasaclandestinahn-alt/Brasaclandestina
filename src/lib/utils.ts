/**
 * Formatea un número como moneda de Lempiras (HNL)
 * Ejemplo: 2000 -> "L. 2,000.00"
 */
export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "L. 0.00";

  return "L. " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
