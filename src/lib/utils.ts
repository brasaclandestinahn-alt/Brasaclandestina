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

/**
 * Convierte un Date o string ISO a formato 'YYYY-MM-DDTHH:mm' respetando la zona horaria LOCAL del cliente.
 * Evita desfases de UTC que saltan al día siguiente en horas de la tarde/noche.
 */
export const formatDatetimeLocal = (dateInput?: string | Date | null): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte un Date o string ISO a formato 'YYYY-MM-DD' respetando la zona horaria LOCAL del cliente.
 */
export const formatDateLocal = (dateInput?: string | Date | null): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
};

