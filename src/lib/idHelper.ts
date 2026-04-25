/**
 * Generates a short unique ID with a given prefix.
 * Uses crypto.randomUUID when available, falls back to Math.random.
 * @param prefix - e.g. "p_", "cat_"
 * @returns e.g. "p_a3f9bc"
 */
export function generateId(prefix: string = ""): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return prefix + crypto.randomUUID().replace(/-/g, "").substring(0, 9);
  }
  return prefix + Math.random().toString(36).substring(2, 11);
}
