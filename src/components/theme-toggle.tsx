"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    (notify) => {
      window.addEventListener("stackscope-theme", notify);
      return () => window.removeEventListener("stackscope-theme", notify);
    },
    () => document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light" as Theme,
  );

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    window.localStorage.setItem("stackscope-theme", next);
    window.dispatchEvent(new Event("stackscope-theme"));
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}><span aria-hidden="true">{theme === "dark" ? "☀" : "◐"}</span></button>;
}
