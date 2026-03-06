import React, { useState, useEffect } from "react";
import "../index.css";

import logo_trans from "../assets/aossie_logo_transparent.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";

import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

const Home = () => {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch(
      "https://api.github.com/repos/AOSSIE-Org/EduAid"
    );

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
    <div className="popup grid-bg w-screen min-h-screen flex justify-center items-center">
      <div className="w-full h-full overflow-auto px-4 py-6 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* LEFT COLUMN */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">

              {/* Logo */}
              <div className="mb-6">
                <img src={logo_trans} alt="logo" className="w-32" />
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                  Edu
                </span>
                <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                  Aid
                </span>
              </h1>

              {/* Subtitle */}
              <div className="text-white text-lg sm:text-xl mt-4 mb-6">
                <p>A tool that can auto-generate short quizzes</p>

                <div className="flex items-center gap-2 mt-2 md:justify-start justify-center">
                  <p>based on user input</p>
                  <img src={starsImg} width={24} height={12} alt="stars" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8">

                <Link to="/question-type" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300">
                    Let's get Started
                    <img src={arrow} width={24} height={24} alt="arrow" />
                  </button>
                </Link>

                <Link to="/history" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300">
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
                className="group"
              >
                <div className="bg-[#45454599] hover:bg-[#5a5a5a99] transition-colors duration-300 w-fit px-4 py-3 rounded-xl flex gap-4 items-center">

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

            {/* RIGHT COLUMN */}
            <div className="flex flex-col justify-center items-center">

              <div className="w-full">
                <div className="bg-[#45454533] backdrop-blur-sm rounded-2xl p-6 border border-[#ffffff20]">

                  <h3 className="text-white text-xl font-semibold mb-6 text-center">
                    Features
                  </h3>

                  <div className="flex flex-col gap-4">

                    {[
                      "Doc/Audio Input",
                      "In-depth questions gen",
                      "Dynamic Google Form Integration",
                    ].map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center rounded-xl px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] gap-4 w-full"
                      >
                        <img src={starsImg} width={32} height={16} alt="" />

                        <div className="text-white text-base sm:text-xl">
                          {feature}
                        </div>
                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;