"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-8 w-8 rounded-lg border flex items-center justify-center transition-colors bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
