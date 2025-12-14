import React from "react";

/**
 * A consistent background + layout wrapper for all extension pages.
 * UI only: does not touch any storage, navigation, or business logic.
 */
export default function ExtensionShell({ children, className = "" }) {
  return (
    <div className={`w-full h-full bg-[#02000F] ${className}`}>
      <div className="w-full h-full bg-custom-gradient bg-opacity-50">
        <div className="w-full h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}
