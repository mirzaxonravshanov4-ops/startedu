import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
