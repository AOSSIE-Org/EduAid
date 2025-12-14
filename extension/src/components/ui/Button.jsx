import React from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "text-white bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] hover:opacity-95",
    secondary:
      "text-white bg-white/10 hover:bg-white/15 border border-white/10",
    ghost:
      "text-white/90 hover:text-white hover:bg-white/10",
    outline:
      "text-white bg-[#02000F] border-gradient hover:bg-white/5",
    danger:
      "text-white bg-red-500/90 hover:bg-red-500",
  };

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    />
  );
}
