"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme, type ThemeMode } from "./ThemeProvider";

const themeOptions: {
  mode: ThemeMode;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    mode: "light",
    label: "Light",
    description: "Always use the light theme",
    icon: <Sun size={17} aria-hidden="true" />,
  },
  {
    mode: "dark",
    label: "Dark",
    description: "Always use the dark theme",
    icon: <Moon size={17} aria-hidden="true" />,
  },
  {
    mode: "system",
    label: "System",
    description: "Follow your device appearance",
    icon: <Laptop size={17} aria-hidden="true" />,
  },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const activeOption = themeOptions.find((option) => option.mode === mode)!;
  const ActiveIcon =
    mode === "light" ? Sun : mode === "dark" ? Moon : Laptop;

  return (
    <details className="relative">
      <summary
        aria-label={`Color theme: ${activeOption.label}`}
        title="Choose color theme"
        className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border-4 border-[#282828] bg-white px-3 font-extrabold shadow-neobrutalism transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CB0F6] [&::-webkit-details-marker]:hidden"
      >
        <ActiveIcon size={18} aria-hidden="true" />
        <span>{activeOption.label}</span>
      </summary>
      <div
        role="group"
        aria-label="Color theme"
        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border-4 border-[#282828] bg-white p-2 shadow-neobrutalism"
      >
        {themeOptions.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={mode === option.mode}
            title={option.description}
            onClick={(event) => {
              setMode(option.mode);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
            className={`flex w-full items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1CB0F6] ${
              mode === option.mode
                ? "bg-[#FFC800]"
                : "bg-white hover:bg-[#FFFAEE]"
            }`}
          >
            {option.icon}
            <span className="flex-1">
              <span className="block font-black">{option.label}</span>
              <span className="block text-xs font-semibold text-[#282828]/65">
                {option.description}
              </span>
            </span>
            {mode === option.mode && (
              <Check size={17} strokeWidth={3} aria-label="Selected" />
            )}
          </button>
        ))}
      </div>
    </details>
  );
}
