import { ShieldAlert } from "lucide-react";
import { describeError, isPermissionError, type AppError } from "@/lib/perm-error";

/** Visible banner for permission / access errors instead of silently showing zeros. */
export function AccessAlert({ error, className = "" }: { error: AppError; className?: string }) {
  const text = describeError(error);
  if (!text) return null;
  const perm = isPermissionError(error);
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        perm
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-secondary text-muted-foreground"
      } ${className}`}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium">{perm ? "Ruxsat xatosi" : "Xatolik"}</div>
        <div className="mt-0.5 break-words opacity-90">{text}</div>
      </div>
    </div>
  );
}
