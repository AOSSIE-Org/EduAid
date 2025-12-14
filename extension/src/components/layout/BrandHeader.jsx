import React from "react";
import logo from "../../assets/aossie_logo.webp";

export default function BrandHeader({ right = null, compact = false }) {
  return (
    <div className={`flex items-center gap-2 px-4 pt-4 ${compact ? "pb-2" : "pb-3"}`}>
      <img src={logo} alt="EduAid" className="w-10 h-10" />
      <div className="text-2xl font-extrabold leading-none">
        <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
          Edu
        </span>
        <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
          Aid
        </span>
      </div>
      <div className="ml-auto">{right}</div>
    </div>
  );
}
