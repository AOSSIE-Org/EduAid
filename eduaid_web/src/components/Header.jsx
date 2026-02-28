import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "../index.css";
import logo from "../assets/aossie_logo_transparent.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Generate" },
  { to: "/history", label: "History" },
];

const Header = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl bg-[#02000F]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="EduAid" className="w-8 h-8 group-hover:drop-shadow-[0_0_8px_rgba(118,0,242,0.8)] transition-all" />
          <span className="text-lg font-black tracking-tight">
            <span className="bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] bg-clip-text text-transparent">EduAid</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive(to)
                  ? "bg-[#7600F2]/20 text-[#c084fc] border border-[#7600F2]/30"
                  : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link to="/upload" className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(118,0,242,0.5)] transition-all duration-300 hover:scale-105">
            Generate Quiz 
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5"
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div ref={menuRef} id="mobile-menu" className="md:hidden transition-all duration-300 overflow-hidden max-h-64 opacity-100 mt-2">
          <div className="mx-4 rounded-2xl bg-[#02000F]/90 backdrop-blur-xl border border-white/[0.08] p-4 flex flex-col gap-2">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(to)
                    ? "bg-[#7600F2]/20 text-[#c084fc]"
                    : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to="/upload" onClick={() => setOpen(false)} className="block w-full mt-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-white text-sm font-bold text-center">
              Generate Quiz 
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
