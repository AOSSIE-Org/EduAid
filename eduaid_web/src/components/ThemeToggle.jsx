import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const STORAGE_KEY = "eduaid-theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

const applyTheme = (theme) => {
  document.documentElement.classList.toggle("light-theme", theme === LIGHT_THEME);
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(DARK_THEME);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const initialTheme =
      savedTheme === LIGHT_THEME || savedTheme === DARK_THEME
        ? savedTheme
        : DARK_THEME;

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
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
      aria-label="Toggle dark mode"
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