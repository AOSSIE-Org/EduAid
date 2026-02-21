import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/aossie_logo_transparent.png";

const Header = ({ imgClass = "w-20 sm:w-24", titleClass = "text-4xl sm:text-5xl font-extrabold", linkClass = "flex flex-col sm:flex-row items-center gap-4 mb-6" }) => {
  return (
    <Link to="/" className={linkClass}>
      <img src={logo} alt="EduAid logo" className={`${imgClass} object-contain`} />
      <div className={`${titleClass} text-center sm:text-left`}>
        <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">Edu</span>
        <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">Aid</span>
      </div>
    </Link>
  );
};

export default Header;
