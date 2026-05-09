import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const KEY = "mbe-theme";

// MBE design baseline lives on :root (dark). The `.dark` legacy block uses
// oklch values that break `hsl(var(--*))` consumers, so we never add it.
// Light theme is opt-in via the `.light` class.
const apply = (t: Theme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (t === "light") root.classList.add("light");
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme) || "dark";
    setTheme(saved);
    apply(saved);
  }, []);

  const toggle = (t: Theme) => {
    setTheme(t);
    apply(t);
    localStorage.setItem(KEY, t);
  };

  return (
    <div className="relative inline-flex items-center h-9 rounded-full bg-secondary hairline p-1 select-none">
      <span
        className="absolute top-1 bottom-1 w-7 rounded-full bg-primary transition-all duration-300 ease-out"
        style={{ left: theme === "dark" ? "4px" : "32px" }}
      />
      <button
        onClick={() => toggle("dark")}
        aria-label="Dark theme"
        className={cn(
          "relative z-10 h-7 w-7 grid place-items-center rounded-full transition-colors",
          theme === "dark" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => toggle("light")}
        aria-label="Light theme"
        className={cn(
          "relative z-10 h-7 w-7 grid place-items-center rounded-full transition-colors",
          theme === "light" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
