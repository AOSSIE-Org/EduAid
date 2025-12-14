import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`glass rounded-2xl px-4 py-3 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <div
      className={`text-white font-bold text-base ${className}`}
      {...props}
    />
  );
}

export function CardSubTitle({ className = "", ...props }) {
  return (
    <div
      className={`text-white/70 text-xs ${className}`}
      {...props}
    />
  );
}
