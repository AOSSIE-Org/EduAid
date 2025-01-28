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
        .catch((err) => {
          setError("Failed to fetch stars");
        });
    }
  }, []);

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div>
          <img src={logo} alt="logo" className="w-24 my-6 mx-6 block transform transition-all duration-300 ease-in-out hover:scale-110 hover" />
          <div className="text-7xl text-center font-extrabold animate-slideInFade">
  <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
    Edu
  </span>
  <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
    Aid
  </span>
</div>




          <div className="text-white text-[1.5rem] text-center my-4 transform transition-all duration-300 ease-in-out hover:scale-105 hover:text-[#FF005C]">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex text-center justify-center gap-4">
              based on user input{" "}
              <img src={starsImg} width={32} height={12} alt="" />
            </div>
          </div>
          <div className="flex justify-center items-center gap-8">
          <div className="my-20">
  <div className="flex items-center rounded-2xl w-fit px-10 py-5 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4 hover:bg-[#7600F2] transition-all duration-300 ease-in-out hover:scale-105 transform transition-all ease-in-out">
    <img src={starsImg} width={48} height={24} alt="" />
    <div className="text-white text-2xl font-bold hover:text-[#FF005C] ">Doc/Audio Input</div>
  </div>
</div>

            <div className="my-20">
              <div className="flex items-center rounded-2xl w-fit px-10 py-5 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4 hover:bg-[#7600F2] transition-all duration-300 ease-in-out hover:scale-105 transform transition-all ease-in-out">
                <img src={starsImg} width={48} height={24} alt="" />
                <div className="text-white text-2xl font-bold hover:text-[#FF005C]">In-depth questions gen</div>
              </div>
            </div>
            <div className="my-20">
              <div className="flex items-center rounded-2xl w-fit px-10 py-5 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-4 hover:bg-[#7600F2] transition-all duration-300 ease-in-out hover:scale-105 transform transition-all ease-in-out">
                <img src={starsImg} width={48} height={24} alt="" />
                <div className="text-white text-2xl font-bold hover:text-[#FF005C]">
                  Dynamic Google Form Integration
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <div className="mt-20 rounded-2xl">
              <a href="question-type">
              <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:scale-105 transform transition-all duration-300 ease-in-out rounded-md">
  Let’s get Started
  <img src={arrow} width={28} height={24} alt="" />
</button>
              </a>
            </div>
            <div className="mt-20 rounded-2xl">
              <a href="history">
              <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:scale-105 transform transition-all duration-300 ease-in-out rounded-md">
  Your previous Work!
  <img src={arrow} width={28} height={24} alt="" />
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
            <div className="bg-[#45454599] mt-8 w-fit mx-auto px-4 py-3 rounded-xl flex gap-4 items-center group-hover:bg-[#5a5a5a99] transform transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg hover:shadow-[#FF005C] transition-colors transform transition-all ease-in-out">
              <img src={gitStar} className="" width={28} height={12} alt="gitstar" />
              <div className="text-white font-semibold">
                {stars !== null ? (
                  <span className="flex text-2xl">
                    {stars}
                    <FaGithub size={36} className="ml-6" />
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
};

export default Home;
