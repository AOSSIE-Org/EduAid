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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false); // State to toggle side panel
  const [pastQuizzes, setPastQuizzes] = useState([]); // State to hold past quizzes

  // Function to fetch GitHub stars
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

  // Function to check if data is older than a day
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

    // Fetch and display past quizzes from localStorage
    const storedQuizzes = JSON.parse(localStorage.getItem("pastQuizzes")) || [];
    setPastQuizzes(storedQuizzes);
  }, []);

  // Toggle the side panel open/close
  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  // Reset stored quizzes
  const resetQuizHistory = () => {
    localStorage.removeItem("pastQuizzes");
    setPastQuizzes([]);
  };

  return (
    <div className="popup w-screen h-screen bg-[#02000F] flex justify-center items-center">
      <div className="w-full h-full bg-cust bg-opacity-50 bg-custom-gradient relative">
        {/* Hamburger Menu for Toggling the Side Panel */}
        <div
          className="absolute top-4 right-10 text-white text-3xl cursor-pointer"
          onClick={toggleSidePanel}
        >
          &#9776; {/* Hamburger Icon */}
        </div>

        {/* Side Panel */}
        {isSidePanelOpen && (
          <div className="side-panel fixed top-0 left-0 h-full bg-[#0f040c] p-6 w-[250px] z-10 shadow-lg rounded-r-xl">
            <div className="flex justify-between items-center">
              <img src={logo} alt="Aossie Logo" className="w-12 mb-4" />
              <div
                className="text-white cursor-pointer text-xl"
                onClick={toggleSidePanel}
              >
                &times; {/* Close Icon */}
              </div>
            </div>

            <h2 className="text-white text-lg font-semibold mb-4">Past Quizzes</h2>
            <ul className="text-white text-sm">
              {pastQuizzes.length === 0 ? (
                <li>No past quizzes found.</li>
              ) : (
                pastQuizzes.slice(0, 5).map((quiz, index) => (
                  <li key={index} className="mb-2">
                    <div>
                      <strong>{quiz.topic}</strong> - {quiz.numQuestions} questions
                      <br />
                      Difficulty: {quiz.difficulty} | Created on: {quiz.createdAt}
                    </div>
                  </li>
                ))
              )}
            </ul>
            <button
              onClick={resetQuizHistory}
              className="mt-4 text-white bg-red-500 px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear History
            </button>
          </div>
        )}

        <div>
          <img src="aossie_transparent.png" alt="logo" className="w-24 my-6 mx-6 block" />
          <div className="text-7xl text-center font-extrabold">
            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
              Edu
            </span>
            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
              Aid
            </span>
          </div>
          <div className="text-white text-[1.5rem] text-center my-4">
            <div>A tool that can auto-generate short quizzes</div>
            <div className="flex text-center justify-center gap-4">
              based on user input{" "}
              <img src={starsImg} width={32} height={12} alt="" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            {[{ text: "Doc/Audio Input", id: 1 }, { text: "In-depth questions gen", id: 2 }, { text: "Dynamic Google Form Integration", id: 3 }].map((feature) => (
              <div
                key={feature.id}
                className="my-4 group relative transition-all duration-300 transform hover:scale-105 md:hover:scale-110 hover:shadow-lg hover:bg-opacity-90"
              >
                <div className="flex items-center rounded-l-2xl w-fit px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] group-hover:shadow-md justify-center gap-4">
                  <img
                    src={starsImg}
                    width={32}
                    height={16}
                    alt=""
                    className="group-hover:animate-spin"
                  />
                  <div className="text-white text-xl group-hover:text-[#FFD700]">
                    {feature.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6">
            <div className="mt-8 rounded-2xl">
              <a href="question-type">
                <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:wave-effect rounded-md">
                  Let’s get Started{" "}
                  <img src={arrow} width={28} height={24} alt="" />
                </button>
              </a>
            </div>
            <div className="mt-8 rounded-2xl">
              <a href="history">
                <button className="items-center text-lg flex justify-center gap-4 text-white px-6 py-3 mx-auto mt-6 border-gradient hover:wave-effect rounded-md">
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
            <div className="bg-[#333333] mt-10 w-fit mx-auto px-4 py-3 rounded-xl flex gap-4 items-center group-hover:bg-[#444444] transition-colors duration-300">
              <img src={gitStar} className="" width={28} height={12} alt="" />
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
