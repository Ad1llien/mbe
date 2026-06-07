import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

type Theme = "dark" | "light";

export const applyTheme = (t: Theme) => {
  document.documentElement.classList.remove("light", "dark");
  if (t === "light") document.documentElement.classList.add("light");
};

export const getThemeKey = (userId?: string | null) =>
  userId ? `mbe-theme-${userId}` : "mbe-theme";

export const ThemeToggle = () => {
  const user = useAuthStore(s => s.user);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const key = getThemeKey(user?.id);
    const saved = (localStorage.getItem(key) as Theme) || "dark";
    setTheme(saved);
    applyTheme(saved);
  }, [user?.id]);

  const toggle = (t: Theme) => {
    const key = getThemeKey(user?.id);
    setTheme(t);
    applyTheme(t);
    localStorage.setItem(key, t);
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
