"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/theme/ThemeProvider";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/**
 * Segmented light / dark / system switch with a sliding indicator.
 * Falls back to a single sun-moon button on narrow screens.
 */
export function ThemeToggle() {
  const { preference, theme, setPreference, toggle } = useTheme();
  const [ready, setReady] = useState(false);

  // Skip the slide animation on first paint so the thumb doesn't fly across
  // when the stored preference is restored.
  useEffect(() => setReady(true), []);

  const index = OPTIONS.findIndex((option) => option.value === preference);

  return (
    <>
      <div
        className="theme-seg"
        role="radiogroup"
        aria-label="Colour theme"
        data-ready={ready ? "true" : "false"}
      >
        <span
          className="theme-seg-thumb"
          style={{ transform: `translateX(${index * 100}%)` }}
          aria-hidden
        />
        {OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={preference === value}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setPreference(value)}
            className={`theme-seg-btn ${preference === value ? "theme-seg-btn-active" : ""}`}
          >
            <Icon className="h-[15px] w-[15px]" aria-hidden />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="theme-icon-btn"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title="Toggle theme"
      >
        <Sun className="theme-icon theme-icon-sun" aria-hidden />
        <Moon className="theme-icon theme-icon-moon" aria-hidden />
      </button>
    </>
  );
}
