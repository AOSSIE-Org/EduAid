import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../index.css";
import logo from "../assets/aossie_logo.webp";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from 'react-icons/fa';

function Popup() {
  const [stars, setStars] = useState(null);
  const [error, setError] = useState("");

  async function fetchGitHubStars() {
    const response = await fetch(
      "https://api.github.com/repos/AOSSIE-Org/EduAid"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch stars");
    }
    const data = await response.json();
    return data.stargazers_count;
  }
  function isMoreThanOneDayOld(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    return Date.now() - timestamp > oneDay;
  }

  useEffect(() => {
    const storedStars = localStorage.getItem("stars");
    const storedTime = localStorage.getItem("fetchTime");
    if (
      storedStars &&
      storedTime &&
      !isMoreThanOneDayOld(parseInt(storedTime))
    ) {
      setStars(parseInt(storedStars));
    } else {
      fetchGitHubStars()
        .then((starCount) => {
          setStars(starCount);
          localStorage.setItem("stars", starCount);
          localStorage.setItem("fetchTime", Date.now().toString());
        })
        .catch((err) => {
          setError("Failed to fetch stars");
        });
    }
  }, []);
  return (
    <div className="popup w-full h-full bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient overflow-y-auto">
        <div className="relative px-4 pt-4 pb-5 sm:px-6 sm:pt-6">
          <img
            src={logo}
            alt="logo"
            className="w-12 sm:w-16 absolute left-4 top-4 sm:left-6 sm:top-6"
          />
          <div className="pt-10 sm:pt-8" />
          <div className="text-center font-extrabold text-[clamp(2.4rem,7vw,3.5rem)]">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
          <div className="text-white text-center my-2 text-[clamp(0.95rem,2.5vw,1rem)]">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex text-center justify-center gap-2">
              based on user input{" "}
              <img src={starsImg} width={22} height={6} alt="" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 mt-2">
            <div className="my-4">
              <div className="flex items-center rounded-l-2xl w-fit max-w-[92%] px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2 whitespace-normal break-words">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-[clamp(0.95rem,2.7vw,1.125rem)]">Doc/Audio Input</div>
              </div>
            </div>
            <div>
              <div className="flex items-center rounded-l-2xl w-fit max-w-[92%] px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2 whitespace-normal break-words">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-[clamp(0.95rem,2.7vw,1.125rem)]">
                  In-depth questions gen
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center rounded-l-2xl w-fit max-w-[92%] px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2 whitespace-normal break-words">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-[clamp(0.95rem,2.7vw,1.125rem)]">
                  Dynamic Google Form Integration
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <div className="rounded-2xl flex-1 min-w-[10.5rem]">
              <a href="/src/pages/home/home.html">
                <button className="w-full bg-black items-center text-base flex justify-center gap-2 text-white px-4 py-2 border-gradient hover:wave-effect rounded-md">
                  Let’s get Started{" "}
                  <img src={arrow} width={20} height={18} alt="" />
                </button>
              </a>
            </div>
            <div className="rounded-2xl flex-1 min-w-[10.5rem]">
              <a href="/src/pages/previous/previous.html">
                <button className="w-full bg-black items-center text-base flex justify-center gap-2 text-white px-4 py-2 border-gradient hover:wave-effect rounded-md">
                  Your previous Work!
                  <img src={arrow} width={20} height={18} alt="" />
                </button>
              </a>
            </div>
          </div>
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="bg-[#45454599] mt-5 w-fit mx-auto px-3 py-2 rounded-xl flex gap-2 items-center group-hover:bg-[#5a5a5a99] transition-colors duration-300">
              <img src={gitStar} className="" width={22} height={6} alt="" />
              <div className="text-white font-semibold">
                {stars !== null ? (
                  <span className="flex text-xl">
                    {stars}
                    <FaGithub size={30} className="ml-4" />
                  </span>
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
}

ReactDOM.render(<Popup />, document.getElementById("root"));
