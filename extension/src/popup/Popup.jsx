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
    <div className="w-[360px] h-[520px] bg-[#02000F] overflow-hidden">

      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient">
        <div>
          <img src={logo} alt="logo" className="w-16 my-4 mx-4 block" />
          <div className="text-3xl text-center font-extrabold">
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
          <div className="grid grid-cols-1 gap-2 px-4 mt-4">
  {[
    "Doc & Audio Input",
    "In-depth Question Generation",
    "Google Form Integration"
  ].map((text) => (
    <div
      key={text}
      className="bg-[#202838] text-white text-sm px-4 py-2 rounded-xl flex items-center gap-2"
    >
      <img src={starsImg} width={16} height={8} alt="" />
      {text}
    </div>
  ))}
</div>

          <div className="flex flex-col gap-2 px-4 mt-6">
  <a
    href={chrome?.runtime?.getURL?.("pages/home/home.html") ?? "pages/home/home.html"}
    className="w-full bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-white py-2 rounded-lg flex justify-center items-center gap-2"
  >
    <span>Get Started</span>
    <img src={arrow} width={18} alt="" />
  </a>

  <a
    href={chrome?.runtime?.getURL?.("pages/previous/previous.html") ?? "pages/previous/previous.html"}
    className="w-full bg-[#202838] text-white py-2 rounded-lg text-center"
  >
    Previous Work
  </a>
</div>
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <a
  href="https://github.com/AOSSIE-Org/EduAid"
  target="_blank"
  rel="noopener noreferrer"
  className="absolute bottom-3 left-1/2 -translate-x-1/2"
>
  <div className="bg-[#202838] px-3 py-1 rounded-lg flex items-center gap-2 text-white text-sm">
    <FaGithub />
    {stars ?? "—"}
  </div>
</a>
          </a>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<Popup />, document.getElementById("root"));
