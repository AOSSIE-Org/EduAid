import React, { useState, useEffect } from "react";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";
import { FaGithub } from "react-icons/fa";

const Home = () => {
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
        .catch(() => {
          setError("Failed to fetch stars");
        });
    }
  }, []);

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div>

          <img src={logo} alt="logo" className="w-20 lg:w-24 my-4  mx-4 lg:mx-6 block" />

          {/* Title */}
          <div className="text-center font-extrabold text-4xl lg:text-7xl">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
          <div className="text-white text-[1.5rem] text-center lg:mt-0 mt-6 mx-2 lg:mb-2 mb-8">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex justify-center gap-2 items-center ">
              based on user input
              <img src={starsImg} width={24} height={12} alt="" />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="my-3">
              <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 ml-5 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4">
                <img src={starsImg} width={32} height={16} alt="" />
                <div className="text-white Lg:text-xl text-lg ">Doc/Audio Input</div>
              </div>
            </div>
            <div className="my-4 ml-2">
              <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4">
                <img src={starsImg} width={32} height={16} alt="" />
                <div className="text-white Lg:text-xl text-lg ">In-depth questions gen</div>
              </div>
            </div>
            <div className="lg:my-4 mt-4 ml-2">
              <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4 lg:mb-2 mb-6">
                <img src={starsImg} width={32} height={16} alt="" />
                <div className="text-white Lg:text-xl text-lg ">
                  Dynamic Google Form Integration
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center gap-4 lg:gap-10 mt-6">
            <a href="question-type" className="lg:w-auto">
              <button className="flex items-center justify-center lg:text-lg text-white px-6 py-3 mx-auto border-gradient hover:wave-effect rounded-md sm:px-4 sm:py-2 text-sm gap-2">
                Let’s get Started
                <img src={arrow} width={20} height={18} alt="" className="ml-2" />
              </button>
            </a>
            <a href="history" className="lg:w-auto">
              <button className="lg:w-auto flex items-center justify-center lg:text-lg text-white px-6 lg:py-2 py-4 mx-auto border-gradient hover:wave-effect rounded-md sm:px-4 sm:py-2 text-sm gap-2">
                Your previous Work!
                <img src={arrow} width={20} height={18} alt="" className="ml-2" />
              </button>
            </a>
          </div>



          <a href="https://github.com/AOSSIE-Org/EduAid" target="_blank" rel="noopener noreferrer" className="group" > <div className="bg-[#45454599] mt-10 w-fit mx-auto px-4 py-3 rounded-xl flex gap-4 items-center group-hover:bg-[#5a5a5a99] transition-colors duration-300"> <img src={gitStar} className="" width={28} height={12} alt="" /> <div className="text-white font-semibold"> {stars !== null ? (<span className="flex text-2xl"> {stars} <FaGithub size={36} className="ml-6" /> </span>) : (<span>{error}</span>)} </div> </div> </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
