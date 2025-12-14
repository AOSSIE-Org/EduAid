import React from "react";

const base =
  "w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 px-4 py-2 outline-none focus:ring-2 focus:ring-[#7600F2]/60";

export function TextInput({ className = "", ...props }) {
  return <input className={`${base} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={`${base} ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }) {
  return (
    <select
      className={`${base} appearance-none ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }) {
  return <div className={`text-white/80 text-xs font-semibold ${className}`} {...props} />;
}
