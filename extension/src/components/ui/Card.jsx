import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`glass rounded-2xl px-4 py-3 transition-shadow duration-200 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return <div className={`text-slate-900 font-bold text-base ${className}`} {...props} />;
}

export function CardSubTitle({ className = "", ...props }) {
  return <div className={`text-slate-600 text-xs ${className}`} {...props} />;
}
