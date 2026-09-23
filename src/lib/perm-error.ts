/** Human-readable (Uzbek) explanation for Supabase/Postgres access errors. */
export type AppError = { message?: string; code?: string; details?: string; hint?: string } | null | undefined;

const PERM_CODES = new Set(["42501", "PGRST301", "PGRST116", "42P01"]);

export function isPermissionError(err: AppError): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    PERM_CODES.has(code) ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("not authorized") ||
    msg.includes("jwt")
  );
}

/** Short Uzbek description shown to the user when access is denied. */
export function describeError(err: AppError): string | null {
  if (!err) return null;
  const raw = err.message ?? "Noma'lum xatolik";
  if (!isPermissionError(err)) return raw;
  const code = err.code ?? "";
  if (code === "42501" || raw.toLowerCase().includes("permission denied")) {
    return `Ruxsat yo'q: bu ma'lumotni ko'rish uchun sizda huquq yetarli emas. (${code || "42501"})`;
  }
  if (raw.toLowerCase().includes("row-level security")) {
    return "Ruxsat yo'q: himoya qoidalari (RLS) bu amalni bloklamoqda.";
  }
  return `Ruxsat xatosi: ${raw}`;
}
