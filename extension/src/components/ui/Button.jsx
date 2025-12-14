import React from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold " +
  "transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.35)] focus:ring-offset-2 focus:ring-offset-transparent";

export function Button({ variant = "primary", className = "", children, ...props }) {
  const variants = {
    primary:
      "text-white bg-gradient-to-r from-[var(--a1)] via-[var(--a2)] to-[var(--a3)] " +
      "shadow-sm hover:shadow-md hover:brightness-[1.02]",
    secondary:
      "text-slate-900 bg-white/80 hover:bg-white border border-slate-200 shadow-sm",
    ghost: "text-slate-700 hover:text-slate-900 hover:bg-white/60",
    outline: "text-slate-900 bg-white/60 border-gradient hover:bg-white/75",
    danger: "text-white bg-red-600 hover:bg-red-700 shadow-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
