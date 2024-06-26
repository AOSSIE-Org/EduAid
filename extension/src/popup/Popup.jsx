import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../index.css";
import logo from "../assets/aossie_logo.png";
import starsImg from "../assets/stars.png";
import arrow from "../assets/arrow.png";
import gitStar from "../assets/gitStar.png";

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
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div>
          <img src={logo} alt="logo" className="w-16 my-4 mx-4 block" />
          <div className="text-5xl text-center font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
          <div className="text-white text-[1rem] text-center my-2">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex text-center justify-center gap-2">
              based on user input{" "}
              <img src={starsImg} width={22} height={6} alt="" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="my-4">
              <div className="flex items-center rounded-l-2xl w-fit px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-lg">Doc/Audio Input</div>
              </div>
            </div>
            <div className="my-2">
              <div className="flex items-center rounded-l-2xl w-fit px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-lg">In-depth questions gen</div>
              </div>
            </div>
            <div className="my-2">
              <div className="flex items-center rounded-l-2xl w-fit px-4 py-2 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] justify-center gap-2">
                <img src={starsImg} width={24} height={12} alt="" />
                <div className="text-white text-lg">
                  Dynamic Google Form Integration
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 rounded-2xl">
            <a href="/src/pages/home/home.html">
              <button className="bg-black items-center text-2xl flex justify-center gap-2 text-white px-6 py-2 mx-auto mt-4 border-gradient">
                Let’s get Started{" "}
                <img src={arrow} width={20} height={18} alt="" />
              </button>
            </a>
          </div>
          <div className="bg-[#45454599] mt-5 w-fit mx-auto px-2 py-2 rounded-xl flex gap-2 items-center">
            <img src={gitStar} className="" width={22} height={6} alt="" />
            <div className="text-white font-semibold">
              {stars !== null ? (
                <span>
                  {stars} <span className="bg-[#1A188D] ml-1 text-white rounded-xl px-2 py-3 mr-[-1]">Github</span>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<Popup />, document.getElementById("root"));
