// components/ui/CustomSwitch.tsx
"use client";

import React, { KeyboardEvent } from "react";
import clsx from "clsx";

type CustomSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  id?: string;
  label?: string; // optional visible label
  className?: string;
};

export default function CustomSwitch({
  checked,
  onChange,
  disabled,
  size = "sm",
  id,
  label,
  className,
}: CustomSwitchProps) {
  const w = size === "sm" ? 36 : 44; // track width in px
  const h = size === "sm" ? 20 : 24; // track height
  const thumb = size === "sm" ? 16 : 20; // thumb size
  const pad = (h - thumb) / 2; // padding inside track

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      {label ? (
        <label
          htmlFor={id}
          className={clsx(
            "text-sm select-none",
            disabled ? "text-white/40" : "text-white/90"
          )}
        >
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKey}
        className={clsx(
          "relative rounded-full transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-indigo-400/70",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          // Track color states
          checked ? "bg-primary" : "bg-white/12 hover:bg-white/18"
        )}
        style={{ width: w, height: h }}
      >
        <span
          aria-hidden="true"
          className={clsx(
            "absolute rounded-full shadow-md transition-transform",
            disabled ? "bg-white/50" : "bg-white"
          )}
          style={{
            width: thumb,
            height: thumb,
            transform: `translateX(${checked ? w - thumb - pad : pad}px)`,
            top: pad,
            left: 0,
          }}
        />
      </button>
    </div>
  );
}
