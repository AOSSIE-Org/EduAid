import React, { useState, useEffect } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import NavbarDemo from "./Navbar.jsx"
const Home = () => {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch("https://api.github.com/repos/AOSSIE-Org/EduAid");
    if (!response.ok) throw new Error("Failed to fetch stars");
    const data = await response.json();
    return data.stargazers_count;
  }

  function isMoreThanOneDayOld(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp > oneDay;
  }

  useEffect(() => {
    const storedStars = localStorage.getItem("stars");
    const storedTime = localStorage.getItem("fetchTime");

    if (storedStars && storedTime && !isMoreThanOneDayOld(parseInt(storedTime))) {
      setStars(parseInt(storedStars));
    } else {
      fetchGitHubStars()
        .then((starCount) => {
          setStars(starCount);
          localStorage.setItem("stars", starCount);
          localStorage.setItem("fetchTime", Date.now().toString());
        })
        .catch(() => setError("Failed to fetch stars"));
    }
  }, []);

  return (
    <div className="popup w-screen h-screen bg-[#000000] ">
      <NavbarDemo/>
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient overflow-auto px-4 py-6 sm:px-8 md:px-16">
        <div className="max-w-5xl mx-auto">
          <img src={logo_trans} alt="logo" className="w-24 my-4 sm:my-6" />

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-center font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </h1>

          {/* Subtitle */}
          <div className="text-white text-lg sm:text-xl text-center mt-4 mb-6">
            <p>A tool that can auto-generate short quizzes</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p>based on user input</p>
              <img src={starsImg} width={24} height={12} alt="stars" />
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col items-end sm:items-center sm:flex-row sm:justify-between gap-4 mt-8">
            {[
              "Doc/Audio Input",
              "In-depth questions gen",
              "Dynamic Google Form Integration",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center rounded-l-2xl sm:rounded-2xl px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] gap-4 w-fit"
              >
                <img src={starsImg} width={32} height={16} alt="" />
                <div className="text-white text-base sm:text-xl">{feature}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-10">
            <Link to="/question-type" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto items-center text-lg flex justify-center gap-3 text-white px-6 py-3 border-gradient hover:wave-effect rounded-md transition-all duration-300">
                Let’s get Started
                <img src={arrow} width={24} height={24} alt="arrow" />
              </button>
            </Link>
            <Link to="/history" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto items-center text-lg flex justify-center gap-3 text-white px-6 py-3 border-gradient hover:wave-effect rounded-md transition-all duration-300">
                Your previous Work!
                <img src={arrow} width={24} height={24} alt="arrow" />
              </button>
            </Link>
          </div>

          {/* GitHub Stars */}
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group block mt-10"
          >
            <div className="bg-[#45454599] hover:bg-[#5a5a5a99] transition-colors duration-300 w-fit mx-auto px-4 py-3 rounded-xl flex gap-4 items-center">
              <img src={gitStar} width={28} height={12} alt="GitHub Star" />
              <div className="text-white font-semibold text-2xl flex items-center gap-4">
                {stars !== null ? (
                  <>
                    {stars}
                    <FaGithub size={32} />
                  </>
                ) : (
                  <span>{error}</span>
                )}
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
