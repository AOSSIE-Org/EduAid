import React, { useState, useEffect } from "react";
import "../index.css";
import logo from "../assets/aossie_logo.png";

import { FaArrowAltCircleRight, FaGithub, FaStar } from "react-icons/fa";
import FeaturesSection from "../components/feature_section";

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
    const oneDay = 24 * 60 * 60 * 1000;
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
    <div className="relative min-h-screen bg-neutral-950">
      {/* Background patterns - moved to lowest z-index */}
      <div className="inset-0">
        <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>
      <img
        src={logo}
        alt=""
        className=" absolute mix-blend-screen rounded-full size-20 m-4"
      />
      {/* Content wrapper - above background */}
      <div className="relative">
        {/* Heading Section */}
        <div className="w-full pt-28 flex items-center justify-center flex-col">
          <h1 className="text-9xl font-extrabold bg-gradient-to-tr from-transparent via-white to-transparent text-transparent bg-clip-text">
            EDUAID
          </h1>
          <p className="mt-10 text-gray-400 text-sm">
            A tool that can auto-generate short quizzes
          </p>
        </div>

        <div className="flex pt-11 items-center justify-center gap-4">
          <a
            href={"/question-type"}
            className="p-2 hover:scale-95 active:scale-105 transition-transform w-44 flex items-center justify-center gap-3 rounded-lg px-4 bg-white text-black"
          >
            Lets get started <FaArrowAltCircleRight />
          </a>
          <a
            className="p-2 w-fit hover:scale-95 active:scale-105 transition-transform flex items-center justify-center gap-3 rounded-lg px-4 bg-transparent border text-white"
            href="history"
          >
            Your previous Work!
          </a>
        </div>

        {/* Features Section */}
        <div className="mt-28 bg-transparent">
          <FeaturesSection />
        </div>
        <div className="w-full relative flex justify-center items-center pb-4 ">
          <div className="w-80 h-14 flex absolute bg-gradient-to-r from-pink-600 to-fuchsia-700 rounded-xl blur"></div>
          <a
            className="w-80 h-14 relative bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg flex items-center justify-between px-4 transition-all "
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center space-x-2">
              <FaGithub className="text-white text-2xl" />
              <span className="text-white font-semibold">GitHub Stars</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaStar className="text-yellow-400 text-xl" />
              <span className="text-white font-bold text-xl">37</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
