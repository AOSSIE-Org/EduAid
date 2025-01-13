import React, { useState, useEffect } from "react";
import logo from "../assets/aossie_logo.png";
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
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <header className="p-4 sm:p-6">
        <img src={logo} alt="AOSSIE logo" className="w-16 sm:w-24" />
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-6">
          <span className="text-green-600">Edu</span>
          <span className="text-yellow-500">Aid</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-center mb-6 sm:mb-8 max-w-2xl">
          A tool that can auto-generate short quizzes based on user input
        </p>
        
        <div className="space-y-3 sm:space-y-4 text-center mb-8 sm:mb-12 w-full max-w-md">
          <div className="bg-yellow-100 rounded-lg p-3 hover:scale-90 transition-all duration-200">
            <span className="font-semibold">Doc/Audio Input</span>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3 hover:scale-90 transition-all duration-200">
            <span className="font-semibold">In-depth questions gen</span>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3 hover:scale-90 transition-all duration-200">
            <span className="font-semibold">Dynamic Google Form Integration</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <a href="question-type" className="w-full sm:w-1/2">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition duration-300">
              Let's get Started
            </button>
          </a>
          <a href="history" className="w-full sm:w-1/2">
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded transition duration-300">
              Your previous Work!
            </button>
          </a>
        </div>
      </main>
      
      <footer className="p-4 sm:p-6 flex justify-center">
        <a
          href="https://github.com/AOSSIE-Org/EduAid"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition duration-300"
        >
          <FaGithub size={24} />
          <span className="font-semibold">
            {stars !== null ? stars : error}
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;