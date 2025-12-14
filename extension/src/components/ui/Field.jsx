import React from "react";

const base =
  "w-full rounded-xl bg-white/80 border border-slate-200 text-slate-900 " +
  "placeholder:text-slate-400 px-3 py-2 text-sm shadow-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.25)] focus:border-[rgba(124,58,237,0.45)]";

export function TextInput({ className = "", ...props }) {
  return <input className={`${base} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`${base} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }) {
  return <select className={`${base} appearance-none ${className}`} {...props} />;
}

export function Label({ className = "", ...props }) {
  return <div className={`text-slate-700 text-xs font-semibold ${className}`} {...props} />;
}
