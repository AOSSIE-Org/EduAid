import React, { useEffect, useLayoutEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const STORAGE_KEY = "eduaid-theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

/** Apply the selected theme class at the document root. */
const applyTheme = (theme) => {
  document.documentElement.classList.toggle("light-theme", theme === LIGHT_THEME);
};

/** Read persisted theme and default to dark mode when absent/invalid. */
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  return savedTheme === LIGHT_THEME || savedTheme === DARK_THEME
    ? savedTheme
    : DARK_THEME;
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => getInitialTheme());

  // Apply theme before paint to prevent initial flash of incorrect theme.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === DARK_THEME ? LIGHT_THEME : DARK_THEME
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle fixed right-4 top-4 z-[1000] rounded-full px-4 py-2 text-sm font-semibold"
      aria-label={theme === DARK_THEME ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === LIGHT_THEME}
      title={theme === DARK_THEME ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="flex items-center gap-2">
        {theme === DARK_THEME ? (
          <>
            <FaSun />
            Light Mode
          </>
        ) : (
          <>
            <FaMoon />
            Dark Mode
          </>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;