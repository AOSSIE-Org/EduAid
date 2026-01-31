import React, { useState, useEffect } from "react";
import "../index.css";
import logo_trans from "../assets/aossie_logo_transparent.png"
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

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
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient overflow-auto px-3 py-4 sm:px-6 sm:py-6 md:px-12 md:py-8 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <img src={logo_trans} alt="logo" className="w-16 sm:w-20 md:w-24 my-3 sm:my-4 md:my-6 mx-auto sm:mx-0" />

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center font-extrabold leading-tight px-2">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </h1>

          {/* Subtitle */}
          <div className="text-white text-base sm:text-lg md:text-xl text-center mt-3 sm:mt-4 mb-4 sm:mb-6 px-2">
            <p className="break-words">A tool that can auto-generate short quizzes</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <p className="break-words">based on user input</p>
              <img src={starsImg} width={24} height={12} alt="stars" className="flex-shrink-0" />
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col items-center sm:items-stretch md:flex-row md:justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 px-2">
            {[
              "Doc/Audio Input",
              "In-depth questions gen",
              "Dynamic Google Form Integration",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] gap-3 sm:gap-4 w-full sm:w-auto sm:flex-shrink-0 max-w-full"
              >
                <img src={starsImg} width={32} height={16} alt="" className="flex-shrink-0" />
                <div className="text-white text-sm sm:text-base md:text-xl break-words min-w-0">{feature}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-8 sm:mt-10 px-2">
            <Link to="/question-type" className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <button className="w-full items-center text-base sm:text-lg flex justify-center gap-3 text-white px-5 py-2.5 sm:px-6 sm:py-3 border-gradient hover:wave-effect rounded-md transition-all duration-300">
                Let's get Started
                <img src={arrow} width={24} height={24} alt="arrow" className="flex-shrink-0" />
              </button>
            </Link>
            <Link to="/history" className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <button className="w-full items-center text-base sm:text-lg flex justify-center gap-3 text-white px-5 py-2.5 sm:px-6 sm:py-3 border-gradient hover:wave-effect rounded-md transition-all duration-300">
                Your previous Work!
                <img src={arrow} width={24} height={24} alt="arrow" className="flex-shrink-0" />
              </button>
            </Link>
          </div>

          {/* GitHub Stars */}
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group block mt-8 sm:mt-10"
          >
            <div className="bg-[#45454599] hover:bg-[#5a5a5a99] transition-colors duration-300 w-fit max-w-full mx-auto px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl flex gap-2 sm:gap-4 items-center">
              <img src={gitStar} width={28} height={12} alt="GitHub Star" className="flex-shrink-0" />
              <div className="text-white font-semibold text-lg sm:text-xl md:text-2xl flex items-center gap-2 sm:gap-4">
                {stars !== null ? (
                  <>
                    <span className="whitespace-nowrap">{stars}</span>
                    <FaGithub size={24} className="sm:w-8 sm:h-8 flex-shrink-0" />
                  </>
                ) : (
                  <span className="text-sm sm:text-base">{error}</span>
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
