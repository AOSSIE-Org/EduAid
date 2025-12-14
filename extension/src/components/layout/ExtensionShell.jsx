import React from "react";

/**
 * Consistent background + layout wrapper for all extension pages.
 * UI only: does not touch any storage, navigation, or business logic.
 */
export default function ExtensionShell({ children, className = "" }) {
  return (
    <div className={`w-full h-full text-[var(--text)] ${className}`}>
      <div className="w-full h-full app-bg">
        <div className="w-full h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}
